import { NextResponse } from "next/server";
import { WRAPPED_SOL_ADDRESS } from "@/utils/solana/price";

const JUPITER_PRICE_ENDPOINT = "https://api.jup.ag/price/v3";

interface TokenPrice {
  createdAt: string;
  liquidity: number;
  usdPrice: number;
  blockId: number;
  decimals: number;
}

interface JupiterPriceResponse {
  [address: string]: TokenPrice;
}

export async function GET() {
  try {
    const url = new URL(JUPITER_PRICE_ENDPOINT);
    url.searchParams.set("ids", WRAPPED_SOL_ADDRESS);

    const apiKey = process.env.JUPITER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "JUPITER_API_KEY is not set in environment variables" },
        { status: 500 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch price: ${response.status}` },
        { status: response.status }
      );
    }

    const data: JupiterPriceResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { error: "Failed to fetch SOL price" },
      { status: 500 }
    );
  }
}

