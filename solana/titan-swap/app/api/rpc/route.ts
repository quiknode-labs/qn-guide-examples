import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side proxy for Solana JSON-RPC.
 *
 * The browser's @solana/kit RPC points at this same-origin route, so the
 * upstream endpoint and auth token stay on the server.
 * Only HTTP JSON-RPC is forwarded — the app confirms transactions by polling
 * getSignatureStatuses rather than via a WebSocket subscription.
 */
const RPC_URL = process.env.QUICKNODE_RPC_URL;
const QUICKNODE_RPC_TOKEN = process.env.QUICKNODE_RPC_TOKEN;

export async function POST(req: Request) {
  if (!RPC_URL) {
    return NextResponse.json(
      { error: "QUICKNODE_RPC_URL is not set. Add it to .env.local." },
      { status: 502 }
    );
  }

  const body = await req.text();
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(QUICKNODE_RPC_TOKEN ? { "x-token": QUICKNODE_RPC_TOKEN } : {}),
      },
      redirect: "error",
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "RPC request failed" }, { status: 502 });
  }
}
