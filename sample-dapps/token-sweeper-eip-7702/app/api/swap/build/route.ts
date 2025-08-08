import { NextRequest, NextResponse } from "next/server"

const API_ENDPOINTS = {
  8453: process.env.AERODROME_BASE_API || "",
  10: process.env.VELODROME_OPTIMISM_API || ""
}

const TARGET_PARAMS = {
  8453: "base",
  10: "optimistic-ethereum"
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chainId = parseInt(searchParams.get('chainId') || '8453')
    
    const endpoint = API_ENDPOINTS[chainId as keyof typeof API_ENDPOINTS]
    const target = TARGET_PARAMS[chainId as keyof typeof TARGET_PARAMS]

    if (!endpoint) {
      return NextResponse.json(
        { error: 'API endpoint not configured for this chain' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const apiUrl = `${endpoint}/v1/swap/build?target=${target}`
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Build API failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Swap build API route error:', error)
    return NextResponse.json(
      { error: `Failed to build swap: ${errorMessage}` },
      { status: 500 }
    )
  }
}