import { NextRequest, NextResponse } from "next/server"
import { isAddress } from "viem"
import { DEX_API_ENDPOINTS } from "@/lib/config"
import { SUPPORTED_CHAINS, APP_CONFIG, type SupportedChainId } from "@/types"

const TARGET_PARAMS: Record<SupportedChainId, string> = {
  [SUPPORTED_CHAINS.BASE]: "base",
  [SUPPORTED_CHAINS.OPTIMISM]: "optimistic-ethereum",
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chainIdParam = searchParams.get('chainId')
    const fromToken = searchParams.get('from_token')
    const toToken = searchParams.get('to_token')
    const amount = searchParams.get('amount')
    const slippage = searchParams.get('slippage') || APP_CONFIG.SLIPPAGE_TOLERANCE.toString()

    // Input validation
    if (!chainIdParam || !fromToken || !toToken || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: chainId, from_token, to_token, amount' },
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

    if (!isAddress(fromToken) || !isAddress(toToken)) {
      return NextResponse.json(
        { error: 'Invalid token address format' },
        { status: 400 }
      )
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount parameter' },
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

    const apiUrl = `${endpoint}/v1/quote?target=${target}&from_token=${fromToken}&to_token=${toToken}&amount=${amount}&slippage=${slippage}`
    
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`Quote API failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Swap quote API route error:', error)
    return NextResponse.json(
      { error: `Failed to fetch swap quote: ${errorMessage}` },
      { status: 500 }
    )
  }
}