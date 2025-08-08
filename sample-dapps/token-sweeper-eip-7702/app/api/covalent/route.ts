import { NextRequest, NextResponse } from "next/server"
import { GoldRushClient } from "@covalenthq/client-sdk"
import { isAddress } from "viem"
import { getServerConfig } from "@/lib/config"

// Types for sanitization
interface SanitizableData {
  [key: string]: unknown
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (typeof value === 'object') {
    const sanitized: SanitizableData = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val)
    }
    return sanitized
  }
  return value
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chainName = searchParams.get('chain')
    const address = searchParams.get('address')

    // Input validation
    if (!chainName || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters: chain and address' },
        { status: 400 }
      )
    }

    if (!isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      )
    }

    const { covalentApiKey } = getServerConfig()
    if (!covalentApiKey) {
      return NextResponse.json(
        { error: 'Covalent API key not configured' },
        { status: 500 }
      )
    }

    const client = new GoldRushClient(covalentApiKey)
    const response = await client.BalanceService.getTokenBalancesForWalletAddress(
      chainName,
      address
    )

    if (response.error_message) {
      return NextResponse.json(
        { error: `Covalent API Error: ${response.error_message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(sanitizeValue(response.data))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Covalent API route error:', error)
    return NextResponse.json(
      { error: `Failed to fetch token balances: ${errorMessage}` },
      { status: 500 }
    )
  }
}