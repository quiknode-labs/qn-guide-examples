import { NextResponse } from "next/server";

const JUPITER_ULTRA_BASE = "https://api.jup.ag/ultra";
const JUPITER_API_KEY = process.env.JUPITER_API_KEY;

// Helper function to create request headers with API key
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };
  
  if (JUPITER_API_KEY) {
    headers["x-api-key"] = JUPITER_API_KEY;
  }
  
  return headers;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress parameter is required" },
        { status: 400 }
      );
    }

    if (!JUPITER_API_KEY) {
      return NextResponse.json([], { status: 200 });
    }

    const response = await fetch(`${JUPITER_ULTRA_BASE}/v1/holdings/${walletAddress}`, {
      headers: getHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();
    const balances: any[] = [];

    // Add SOL balance (native Solana)
    if (data.amount && parseInt(data.amount) > 0) {
      balances.push({
        mint: "So11111111111111111111111111111111111111112", // SOL mint address
        balance: parseInt(data.amount),
        decimals: 9,
      });
    }

    // Add SPL token balances
    if (data.tokens && typeof data.tokens === "object") {
      for (const [mint, tokenAccounts] of Object.entries(data.tokens)) {
        if (Array.isArray(tokenAccounts) && tokenAccounts.length > 0) {
          // Sum up all token accounts for this mint
          let totalAmount = 0;
          let decimals = 0;

          for (const account of tokenAccounts as any[]) {
            if (account.amount) {
              totalAmount += parseInt(account.amount);
              decimals = account.decimals || 0;
            }
          }

          if (totalAmount > 0) {
            balances.push({
              mint,
              balance: totalAmount,
              decimals,
            });
          }
        }
      }
    }

    return NextResponse.json(balances);
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch token balances" },
      { status: 500 }
    );
  }
}

