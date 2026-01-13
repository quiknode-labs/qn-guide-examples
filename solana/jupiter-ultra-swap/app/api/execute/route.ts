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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signedTransaction, requestId } = body;

    if (!signedTransaction) {
      return NextResponse.json(
        { error: "signedTransaction is required" },
        { status: 400 }
      );
    }

    if (!JUPITER_API_KEY) {
      return NextResponse.json(
        { error: "Jupiter Ultra API requires an API key." },
        { status: 500 }
      );
    }

    const response = await fetch(`${JUPITER_ULTRA_BASE}/v1/execute`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        signedTransaction,
        requestId,
      }),
    });

    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error executing swap:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute swap" },
      { status: 500 }
    );
  }
}

