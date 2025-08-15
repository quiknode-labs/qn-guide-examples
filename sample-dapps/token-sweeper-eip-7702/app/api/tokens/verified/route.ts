import { NextRequest, NextResponse } from "next/server"
import { DEX_API_ENDPOINTS } from "@/lib/config"
import { SUPPORTED_CHAINS, type SupportedChainId } from "@/types"

const TARGET_PARAMS: Record<SupportedChainId, string> = {
  [SUPPORTED_CHAINS.BASE]: "base",
  [SUPPORTED_CHAINS.OPTIMISM]: "optimistic-ethereum",
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chainIdParam = searchParams.get('chainId')
    const limit = searchParams.get('limit') || '1000'
    const listedOnly = searchParams.get('listed_only') === 'true'

    // Input validation
    if (!chainIdParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: chainId' },
        { status: 400 }
      )
    }

    const chainId = parseInt(chainIdParam) as SupportedChainId
    
    if (!Object.values(SUPPORTED_CHAINS).includes(chainId)) {
      return NextResponse.json(
        { error: 'Unsupported chain ID' },
        { status: 400 }
      )
    }

    if (isNaN(parseInt(limit)) || parseInt(limit) <= 0) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      )
    }

    const endpoint = DEX_API_ENDPOINTS[chainId]
    const target = TARGET_PARAMS[chainId]

    if (!endpoint) {
      return NextResponse.json(
        { error: 'API endpoint not configured for this chain' },
        { status: 500 }
      )
    }

    const apiUrl = `${endpoint}/v1/tokens?target=${target}&limit=${limit}&listed_only=${listedOnly}`
    
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Verified tokens API route error:', error)
    return NextResponse.json(
      { error: `Failed to fetch verified tokens: ${errorMessage}` },
      { status: 500 }
    )
  }
}