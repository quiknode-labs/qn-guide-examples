import { NextResponse } from "next/server";

const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC_URL || "https://api.mainnet-beta.solana.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, params, id } = body;

    if (!method) {
      return NextResponse.json(
        { error: "method is required" },
        { status: 400 }
      );
    }

    const response = await fetch(QUICKNODE_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: id || 1,
        method,
        params: params || [],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `RPC request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error proxying RPC request:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to proxy RPC request" },
      { status: 500 }
    );
  }
}

