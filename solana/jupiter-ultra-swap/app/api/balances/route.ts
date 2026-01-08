import { NextResponse } from "next/server";
import { assertIsAddress } from "@solana/kit";

const JUPITER_ULTRA_BASE = "https://api.jup.ag/ultra";
const JUPITER_API_KEY = process.env.JUPITER_API_KEY;
const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC_URL;

// Validate Solana wallet address using @solana/kit to prevent SSRF attacks
function isValidWalletAddress(address: string): boolean {
  try {
    assertIsAddress(address);
    return true;
  } catch {
    return false;
  }
}

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

// Fetch SOL balance via RPC when Jupiter API key is not available
async function fetchSOLBalanceViaRPC(walletAddress: string): Promise<number> {
  if (!QUICKNODE_RPC_URL) {
    // If no RPC URL, return 0 (fallback to public RPC would require different approach)
    return 0;
  }

  try {
    const rpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [walletAddress],
    };

    const response = await fetch(QUICKNODE_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rpcRequest),
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.result?.value || 0;
  } catch (error) {
    console.error("Error fetching SOL balance via RPC:", error);
    return 0;
  }
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

    // Validate wallet address to prevent SSRF attacks
    if (!isValidWalletAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid walletAddress parameter" },
        { status: 400 }
      );
    }

    // If Jupiter API key is missing, fetch SOL balance via RPC as fallback
    // This allows users to swap SOL even without the API key
    if (!JUPITER_API_KEY) {
      const balances: any[] = [];
      
      // Fetch SOL balance via RPC
      const solBalanceLamports = await fetchSOLBalanceViaRPC(walletAddress);
      
      if (solBalanceLamports > 0) {
        balances.push({
          mint: "So11111111111111111111111111111111111111112", // SOL mint address
          balance: solBalanceLamports,
          decimals: 9,
        });
      }
      
      // Note: SPL token balances require Jupiter API key, so we only return SOL balance
      return NextResponse.json(balances, { status: 200 });
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
              decimals = account.decimals ?? 0;
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

