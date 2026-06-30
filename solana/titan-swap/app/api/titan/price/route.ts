import { NextResponse } from "next/server";
import { fetchPrice } from "@/lib/titan-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const inputMint = sp.get("inputMint");
  const outputMint = sp.get("outputMint");
  const amount = sp.get("amount");

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "inputMint, outputMint and amount are required" },
      { status: 400 }
    );
  }

  try {
    const slippageBps = sp.get("slippageBps");
    const price = await fetchPrice({
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps ? Number(slippageBps) : undefined,
    });
    return NextResponse.json(price);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch price";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
