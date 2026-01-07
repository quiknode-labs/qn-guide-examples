import { NextResponse } from "next/server";

const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC_URL || "https://api.mainnet-beta.solana.com";

// This endpoint returns the RPC URL for the wallet adapter
// Note: This exposes the RPC URL to the client, but RPC URLs are typically public endpoints
// The actual API key is kept server-side and used only in the proxy route
export async function GET() {
  return NextResponse.json({ rpcUrl: QUICKNODE_RPC_URL });
}

