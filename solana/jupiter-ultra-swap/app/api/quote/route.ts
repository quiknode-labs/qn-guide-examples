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

// Helper function to parse error messages from API responses
async function parseErrorResponse(response: Response): Promise<string> {
  const responseText = await response.text();
  try {
    const errorData = JSON.parse(responseText);
    return errorData.error || errorData.message || `Request failed: ${response.status}`;
  } catch {
    return responseText || `Request failed: ${response.status}`;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inputMint = searchParams.get("inputMint");
    const outputMint = searchParams.get("outputMint");
    const amount = searchParams.get("amount");
    const slippageBps = searchParams.get("slippageBps") || "50";
    const taker = searchParams.get("taker");

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: "inputMint, outputMint, and amount parameters are required" },
        { status: 400 }
      );
    }

    if (!JUPITER_API_KEY) {
      return NextResponse.json(
        { error: "Jupiter Ultra API requires an API key. Please set JUPITER_API_KEY in your .env.local file." },
        { status: 500 }
      );
    }

    // Build query parameters
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: Math.floor(parseFloat(amount)).toString(),
      slippageBps,
    });

    if (taker) {
      params.append("taker", taker);
    }

    const response = await fetch(`${JUPITER_ULTRA_BASE}/v1/order?${params}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const ultraData = await response.json();
    console.log("Jupiter Ultra API Response:", ultraData);

    // Handle both nested and flat response structures
    const orderData = ultraData.order || ultraData;

    if (orderData.error || orderData.errorCode) {
      return NextResponse.json(
        { error: orderData.error || `API error: ${orderData.errorCode}` },
        { status: 500 }
      );
    }

    if (!orderData.inAmount || !orderData.outAmount) {
      return NextResponse.json(
        { error: "Invalid response: missing inAmount or outAmount" },
        { status: 500 }
      );
    }

    const quote = {
      inputMint,
      outputMint,
      inAmount: orderData.inAmount,
      outAmount: orderData.outAmount,
      otherAmountThreshold: orderData.outAmount,
      swapMode: orderData.swapMode || "ExactIn",
      slippageBps: orderData.slippageBps || parseInt(slippageBps),
      priceImpactPct: orderData.priceImpactPct || orderData.priceImpact || "0",
      routePlan: orderData.routePlan || [],
      _ultraTransaction: orderData.transaction,
      _ultraRequestId: orderData.requestId || ultraData.requestId,
    };

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Error fetching swap quote:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch swap quote" },
      { status: 500 }
    );
  }
}

