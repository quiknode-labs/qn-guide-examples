"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import type { Address } from "viem"
import { useVerifiedTokens } from "./use-verified-tokens"
import { MOCK_TOKENS, getCovalentChainName } from "@/lib/config"
import type { Token, ApiStatus, SupportedChainId } from "@/types"
import { APP_CONFIG } from "@/types"
import { logger } from "@/lib/logger"

// Cache to prevent duplicate API calls with versioning
interface TokenCacheEntry {
  data: Token[]
  timestamp: number
  version: number
}

const cache = new Map<string, TokenCacheEntry>()
let tokenCacheVersion = 1

// Utility function to invalidate token balance cache
export const invalidateTokenBalanceCache = () => {
  tokenCacheVersion++
  console.log(`🧹 Invalidated token balance cache, new version: ${tokenCacheVersion}`)
}



export function useTokenBalances(address: string | undefined, chainId: SupportedChainId) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('untested')
  
  const { isTokenVerified, loading: verifiedLoading, apiStatus: verifiedApiStatus, isReady: verificationReady } = useVerifiedTokens(chainId)
  const prevAddressRef = useRef<string | undefined>(address)

  const cacheKey = useMemo(() => `${address}-${chainId}`, [address, chainId])

  // Clear tokens and reset state when address changes
  useEffect(() => {
    if (prevAddressRef.current !== address) {
      setTokens([])
      setError(null)
      setApiStatus('untested')
      prevAddressRef.current = address
    }
  }, [address])

  const fetchTokens = useCallback(async () => {
    if (!address) return
    
    // Wait for verified tokens to be ready before filtering
    if (!verificationReady) {
      console.log('🔄 Waiting for token verification to be ready...')
      return
    }

    // Check cache first (with version check)
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < APP_CONFIG.CACHE_TTL && cached.version === tokenCacheVersion) {
      console.log(`📋 Loading tokens from cache for ${address}:`, cached.data.length, 'tokens')
      setTokens(cached.data)
      setApiStatus('working')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const chainName = getCovalentChainName(chainId)
      
      const response = await fetch(`/api/covalent?chain=${chainName}&address=${address}`)
            
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.items) {
        setApiStatus('working')

        const filteredTokens = data.items
          .filter((token: unknown) => {
            if (!token || typeof token !== 'object') return false
            const tokenObj = token as Record<string, unknown>
            const isErc20 = Array.isArray(tokenObj.supports_erc) && tokenObj.supports_erc.includes("erc20")
            const isNotNative = !tokenObj.native_token
            const hasValue = typeof tokenObj.quote === 'number' && tokenObj.quote > APP_CONFIG.MIN_TOKEN_VALUE_USD
            const hasBalance = tokenObj.balance && tokenObj.balance !== "0"
            const isNotSpam = !tokenObj.is_spam
            const isVerified = typeof tokenObj.contract_address === 'string' && isTokenVerified(tokenObj.contract_address)
            
            // Log filtering decisions for debugging
            const tokenAddress = String(tokenObj.contract_address)
            if (isErc20 && isNotNative && hasValue && hasBalance && isNotSpam && !isVerified) {

              console.log(`🚫 Filtering out token: ${tokenObj.contract_ticker_symbol} (${tokenAddress})`)
              console.log(`Checks passed: isErc20=${isErc20}, isNotNative=${isNotNative}, hasValue=${hasValue}, hasBalance=${hasBalance}, isNotSpam=${isNotSpam}, isVerified=${isVerified}`)
            }
            
            return isErc20 && isNotNative && hasValue && hasBalance && isNotSpam && isVerified
          })
            .map((token: unknown): Token => {
              const tokenObj = token as Record<string, unknown>
              return {
                contract_address: String(tokenObj.contract_address) as Address,
                contract_name: String(tokenObj.contract_name || "Unknown Token"),
                contract_ticker_symbol: String(tokenObj.contract_ticker_symbol || "???"),
                contract_decimals: Number(tokenObj.contract_decimals || 18),
                logo_urls: {
                  token_logo_url: String(
                    (tokenObj.logo_urls as { token_logo_url?: string })?.token_logo_url ||
                    `/placeholder.svg?height=40&width=40&text=${tokenObj.contract_ticker_symbol}`
                  ),
                },
                supports_erc: Array.isArray(tokenObj.supports_erc) ? tokenObj.supports_erc.map(String) : ["erc20"],
                native_token: Boolean(tokenObj.native_token),
                is_spam: Boolean(tokenObj.is_spam),
                balance: String(tokenObj.balance || "0"),
                quote: Number(tokenObj.quote || 0),
              }
            })
            .sort((a: Token, b: Token) => b.quote - a.quote) // Sort by USD value descending

        console.log(`✅ Filtered ${data.items.length} raw tokens down to ${filteredTokens.length} verified tokens`)
        
        if (filteredTokens.length === 0) {
          console.log(`⚠️ No valid ERC-20 tokens found for ${address} on chain ${chainId}`)
          setError("No valid ERC-20 tokens found in this wallet")
        }
        
        setTokens(filteredTokens)
        
        // Cache the result with version
        cache.set(cacheKey, {
          data: filteredTokens,
          timestamp: Date.now(),
          version: tokenCacheVersion
        })
        
        console.log(`💾 Cached ${filteredTokens.length} tokens for ${address}:`, filteredTokens.map((t: Token) => t.contract_ticker_symbol))
      } else {
        throw new Error("No token data received from API - response.data is null")
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      logger.apiError('GET', `/api/covalent?chain=${getCovalentChainName(chainId)}&address=${address}`, err)
      setError(`Failed to fetch tokens: ${errorMessage}`)
      setApiStatus('failed')

      // Fallback to mock data on API error
      logger.warn("Falling back to mock data due to API error")
      const filteredTokens = MOCK_TOKENS.filter(
        (token) => !token.native_token && token.supports_erc.includes("erc20") && token.quote > 0,
      ).sort((a, b) => b.quote - a.quote)

      setTokens(filteredTokens)
    } finally {
      setLoading(false)
    }
  }, [address, chainId, isTokenVerified, verificationReady, cacheKey])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  return {
    tokens,
    loading: loading || verifiedLoading,
    error,
    apiStatus,
    verificationStatus: verifiedApiStatus,
    refetch: fetchTokens,
    verificationReady, // Export so components know when filtering is ready
  }
}
