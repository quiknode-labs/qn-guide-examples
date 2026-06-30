import { NextResponse } from "next/server";
import { fetchSwap } from "@/lib/titan-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const inputMint = sp.get("inputMint");
  const outputMint = sp.get("outputMint");
  const amount = sp.get("amount");
  const userPublicKey = sp.get("userPublicKey");

  if (!inputMint || !outputMint || !amount || !userPublicKey) {
    return NextResponse.json(
      { error: "inputMint, outputMint, amount and userPublicKey are required" },
      { status: 400 }
    );
  }

  try {
    const slippageBps = sp.get("slippageBps");
    const simulate = sp.get("simulate");
    const swap = await fetchSwap({
      inputMint,
      outputMint,
      amount,
      userPublicKey,
      slippageBps: slippageBps ? Number(slippageBps) : undefined,
      simulate: simulate != null ? simulate === "true" : undefined,
    });
    return NextResponse.json(swap);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch swap";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
