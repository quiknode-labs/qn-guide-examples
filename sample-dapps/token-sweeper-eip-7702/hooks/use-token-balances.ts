"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import type { Address } from "viem"
import { useVerifiedTokens } from "./use-verified-tokens"
import { MOCK_TOKENS, getCovalentChainName } from "@/lib/config"
import type { Token, ApiStatus, SupportedChainId } from "@/types"
import { APP_CONFIG } from "@/types"
import { logger } from "@/lib/logger"

// Cache to prevent duplicate API calls
const cache = new Map<string, { data: Token[], timestamp: number }>()



export function useTokenBalances(address: string | undefined, chainId: SupportedChainId) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('untested')
  
  const { isTokenVerified, loading: verifiedLoading, apiStatus: verifiedApiStatus } = useVerifiedTokens(chainId)
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
    
    // Wait for verified tokens to load first
    if (verifiedLoading) return

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < APP_CONFIG.CACHE_TTL) {
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
            const isVerified = typeof tokenObj.contract_address === 'string' && isTokenVerified(tokenObj.contract_address)
            
            return isErc20 && isNotNative && hasValue && hasBalance && isVerified
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

        if (filteredTokens.length === 0) {
          setError("No valid ERC-20 tokens found in this wallet")
        }
        
        setTokens(filteredTokens)
        
        // Cache the result
        cache.set(cacheKey, {
          data: filteredTokens,
          timestamp: Date.now()
        })
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
  }, [address, chainId, isTokenVerified, verifiedLoading, verifiedApiStatus, cacheKey])

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
  }
}
