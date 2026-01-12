import { NextResponse } from "next/server";

const JUPITER_API_BASE = "https://api.jup.ag";
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

export async function GET() {
  try {
    // Determine base URL: use Pro API if API key available, otherwise Lite API
    const baseUrl = JUPITER_API_KEY 
      ? `${JUPITER_API_BASE}/tokens/v2` 
      : "https://lite-api.jup.ag/tokens/v2";
    
    // Try verified tag endpoint to get all verified tokens
    const endpoints = [
      `${baseUrl}/tag?query=verified`,
      // Fallback to lite API if Pro API fails
      ...(JUPITER_API_KEY ? ["https://lite-api.jup.ag/tokens/v2/tag?query=verified"] : [])
    ];

    for (const endpoint of endpoints) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(endpoint, {
          headers: getHeaders(),
          cache: "no-store",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          // v2 API returns an array of token objects
          if (Array.isArray(data)) {
            // Filter to only include verified tokens for safety
            // Map v2 API response to our Token interface
            const tokens = data
              .filter((token: any) => token.isVerified === true)
              .map((token: any) => ({
                address: token.id || token.address,
                symbol: token.symbol || "",
                name: token.name || "",
                decimals: token.decimals ?? 9,
                logoURI: token.icon || token.logoURI,
              }));
            
            return NextResponse.json(tokens);
          }
        } else {
          // Check for 401 Unauthorized - invalid API key
          // Only show API key error if we're using the Pro API (not lite API)
          if (response.status === 401 && JUPITER_API_KEY && endpoint.includes(JUPITER_API_BASE)) {
            return NextResponse.json(
              { error: "Jupiter API key is not valid. Please check your JUPITER_API_KEY environment variable." },
              { status: 401 }
            );
          }
          console.warn(`Failed to fetch from ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        // Log error but continue to next endpoint
        if (error.name === "AbortError") {
          console.warn(`Timeout fetching from ${endpoint}`);
        } else if (error.name === "TypeError" && error.message?.includes("Failed to fetch")) {
          console.warn(`Network error fetching from ${endpoint}:`, error.message);
        } else {
          console.warn(`Error fetching from ${endpoint}:`, error);
        }
        continue;
      }
    }

    // If we got here, all endpoints failed
    // Check if any endpoint returned a 401 (this would have been returned already)
    console.error("Failed to fetch token list from all endpoints");
    return NextResponse.json(
      { error: "Failed to fetch token list from all endpoints" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error fetching token list:", error);
    return NextResponse.json(
      { error: "Failed to fetch token list" },
      { status: 500 }
    );
  }
}

