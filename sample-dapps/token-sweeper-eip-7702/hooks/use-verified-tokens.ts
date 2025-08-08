"use client"

import { useState, useCallback, useEffect } from "react"

// Simple in-memory cache with TTL
interface CacheEntry {
  verifiedTokens: Set<string>
  timestamp: number
  apiStatus: 'working' | 'failed'
}

const cache = new Map<number, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface VerifiedToken {
  address: string
  symbol: string
  decimals: number
  listed: boolean
}


export function useVerifiedTokens(chainId: number) {
  const [verifiedTokens, setVerifiedTokens] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'untested' | 'working' | 'failed'>('untested')

  const fetchVerifiedTokens = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Check cache first
    const cached = cache.get(chainId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Create a new Set to avoid reference issues
      setVerifiedTokens(new Set(cached.verifiedTokens))
      setApiStatus(cached.apiStatus)
      setLoading(false)
      return
    }

    try {      
      const response = await fetch(`/api/tokens/verified?chainId=${chainId}&limit=1000&listed_only=true`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.tokens && Array.isArray(data.tokens)) {
        const verifiedAddresses = new Set<string>(
          data.tokens
            .filter((token: VerifiedToken) => token.listed && token.address)
            .map((token: VerifiedToken) => token.address.toLowerCase())
        )

        setVerifiedTokens(verifiedAddresses)
        setApiStatus('working')
        
        // Cache the result
        cache.set(chainId, {
          verifiedTokens: verifiedAddresses,
          timestamp: Date.now(),
          apiStatus: 'working'
        })
      } else {
        throw new Error(`Invalid response format - expected tokens array, got: ${typeof data.tokens}`)
      }
    } catch (err: any) {
      console.error("❌ Error fetching verified tokens:", err)
      setError(err.message)
      setApiStatus('failed')

      // Try to keep any previously cached verified tokens
      const previousCache = cache.get(chainId)
      cache.set(chainId, {
        verifiedTokens: previousCache?.verifiedTokens || new Set(),
        timestamp: Date.now(),
        apiStatus: 'failed'
      })
    } finally {
      setLoading(false)
    }
  }, [chainId])

  useEffect(() => {
    fetchVerifiedTokens()
  }, [fetchVerifiedTokens])

  const isTokenVerified = useCallback((tokenAddress: string): boolean => {
    // If we have no verified tokens (API failed or no endpoint), allow all tokens
    if (verifiedTokens.size === 0 && apiStatus === 'failed') {
      return true
    }
    
    // Otherwise, check if token is in verified list (case-insensitive)
    const isVerified = verifiedTokens.has(tokenAddress.toLowerCase())
    return isVerified
  }, [verifiedTokens, apiStatus])

  return {
    verifiedTokens,
    loading,
    error,
    apiStatus,
    isTokenVerified,
    refetch: fetchVerifiedTokens,
  }
}