"use client"

import { useState, useCallback, useEffect } from "react"

// Simple in-memory cache with TTL and versioning
interface CacheEntry {
  verifiedTokens: Set<string>
  timestamp: number
  apiStatus: 'working' | 'failed'
  version: number // Add versioning for cache invalidation
}

const cache = new Map<number, CacheEntry>()
let cacheVersion = 1 // Global cache version for invalidation
import { APP_CONFIG } from "@/types"

// Utility function to invalidate all caches (can be called externally)
export const invalidateVerifiedTokensCache = () => {
  cacheVersion++
  console.log(`🧹 Invalidated verified tokens cache, new version: ${cacheVersion}`)
}

interface VerifiedToken {
  address: string
  symbol: string
  decimals: number
  listed: boolean
}


export function useVerifiedTokens(chainId: number) {
  const [verifiedTokens, setVerifiedTokens] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true) // Start as loading to prevent premature filtering
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'untested' | 'working' | 'failed'>('untested')
  const [isReady, setIsReady] = useState(false) // New state to track when data is ready for filtering

  const fetchVerifiedTokens = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Check cache first (with version check)
    const cached = cache.get(chainId)
    if (cached && Date.now() - cached.timestamp < APP_CONFIG.CACHE_TTL && cached.version === cacheVersion) {
      // Create a new Set to avoid reference issues
      setVerifiedTokens(new Set(cached.verifiedTokens))
      setApiStatus(cached.apiStatus)
      setLoading(false)
      setIsReady(true)
      console.log(`✅ Verified tokens loaded from cache for chain ${chainId}:`, cached.verifiedTokens.size, 'tokens')
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
        setIsReady(true)
        console.log(`✅ Verified tokens fetched from API for chain ${chainId}:`, verifiedAddresses.size, 'tokens')
        
        // Cache the result with current version
        cache.set(chainId, {
          verifiedTokens: verifiedAddresses,
          timestamp: Date.now(),
          apiStatus: 'working',
          version: cacheVersion
        })
      } else {
        throw new Error(`Invalid response format - expected tokens array, got: ${typeof data.tokens}`)
      }
    } catch (err: any) {
      console.error(`❌ Error fetching verified tokens for chain ${chainId}:`, err)
      setError(err.message)
      setApiStatus('failed')

      // Try to keep any previously cached verified tokens, but be more conservative
      const previousCache = cache.get(chainId)
      if (previousCache && previousCache.verifiedTokens.size > 0) {
        // Use cached data if available
        setVerifiedTokens(new Set(previousCache.verifiedTokens))
        setIsReady(true)
        console.log(`⚠️ Using cached verified tokens due to API error: ${previousCache.verifiedTokens.size} tokens`)
      } else {
        // No cache available - start with empty set but mark as ready to prevent blocking
        setVerifiedTokens(new Set())
        setIsReady(true)
        console.log(`⚠️ No cached verified tokens available, starting with empty set for chain ${chainId}`)
      }
      
      cache.set(chainId, {
        verifiedTokens: previousCache?.verifiedTokens || new Set(),
        timestamp: Date.now(),
        apiStatus: 'failed',
        version: cacheVersion
      })
    } finally {
      setLoading(false)
    }
  }, [chainId])

  useEffect(() => {
    fetchVerifiedTokens()
  }, [fetchVerifiedTokens])

  const isTokenVerified = useCallback((tokenAddress: string): boolean => {
    // Don't filter if we're not ready yet (prevents premature filtering)
    if (!isReady) {
      console.log(`🔄 Verification not ready yet for token: ${tokenAddress}`)
      return false
    }
    
    // If API failed and we have no cached tokens, be more conservative
    if (verifiedTokens.size === 0 && apiStatus === 'failed') {
      console.log(`⚠️ API failed and no cached tokens, rejecting token: ${tokenAddress}`)
      return false
    }
    
    // If API failed but we have cached tokens, use them
    if (apiStatus === 'failed' && verifiedTokens.size > 0) {
      const isVerified = verifiedTokens.has(tokenAddress.toLowerCase())
      console.log(`📋 Using cached verification for ${tokenAddress}: ${isVerified}`)
      return isVerified
    }
    
    // Normal case - check if token is in verified list (case-insensitive)
    const isVerified = verifiedTokens.has(tokenAddress.toLowerCase())
    return isVerified
  }, [verifiedTokens, apiStatus, isReady])

  return {
    verifiedTokens,
    loading,
    error,
    apiStatus,
    isTokenVerified,
    refetch: fetchVerifiedTokens,
    isReady, // Export the ready state for dependent hooks
  }
}