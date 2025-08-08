import type { Token, SupportedChainId } from "@/types"
import { SUPPORTED_CHAINS } from "@/types"

/**
 * Mock token data for development/fallback
 */
export const MOCK_TOKENS: Token[] = [
  {
    contract_address: "0x21cfcfc3d8f98fc728f48341d10ad8283f6eb7ab",
    contract_name: "True",
    contract_ticker_symbol: "TRUE",
    contract_decimals: 18,
    logo_urls: {
      token_logo_url: "/placeholder.svg?height=40&width=40&text=TRUE",
    },
    supports_erc: ["erc20"],
    native_token: false,
    is_spam: false,
    balance: "1066680000000000000000000",
    quote: 124.56,
  },
  {
    contract_address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    contract_name: "USD Coin",
    contract_ticker_symbol: "USDC",
    contract_decimals: 6,
    logo_urls: {
      token_logo_url: "/placeholder.svg?height=40&width=40&text=USDC",
    },
    supports_erc: ["erc20"],
    native_token: false,
    is_spam: false,
    balance: "50000000",
    quote: 50.0,
  },
] as const

/**
 * Utility functions for chain operations
 */
export const getChainName = (chainId: number): string => {
  switch (chainId) {
    case SUPPORTED_CHAINS.BASE:
      return "Base"
    case SUPPORTED_CHAINS.OPTIMISM:
      return "Optimism"
    default:
      return "Base" // Default fallback
  }
}

export const getCovalentChainName = (chainId: number): string => {
  switch (chainId) {
    case SUPPORTED_CHAINS.BASE:
      return "base-mainnet"
    case SUPPORTED_CHAINS.OPTIMISM:
      return "optimism-mainnet"
    default:
      return "base-mainnet"
  }
}

export const getTrustWalletChainName = (chainId: SupportedChainId): string | null => {
  switch (chainId) {
    case SUPPORTED_CHAINS.BASE:
      return "base"
    case SUPPORTED_CHAINS.OPTIMISM:
      return "optimism"
    default:
      return null
  }
}

/**
 * Environment variables with proper typing
 */
export interface ServerEnvironmentConfig {
  covalentApiKey?: string
  aerodromeBaseApi?: string
  velodromeOptimismApi?: string
}

export const getServerConfig = (): ServerEnvironmentConfig => ({
  covalentApiKey: process.env.COVALENT_API_KEY,
  aerodromeBaseApi: process.env.AERODROME_BASE_API,
  velodromeOptimismApi: process.env.VELODROME_OPTIMISM_API,
})

/**
 * DEX API endpoints mapping
 */
export const DEX_API_ENDPOINTS: Record<SupportedChainId, string> = {
  [SUPPORTED_CHAINS.BASE]: process.env.AERODROME_BASE_API || "",
  [SUPPORTED_CHAINS.OPTIMISM]: process.env.VELODROME_OPTIMISM_API || "",
} as const