import { NFTMetadata } from './ipfs'

// Cache configuration
const CACHE_VERSION = 'v1'
const METADATA_CACHE_KEY = `${CACHE_VERSION}:metadata`
const TOKEN_CACHE_KEY = `${CACHE_VERSION}:tokens`
const METADATA_TTL = 1000 * 60 * 60 * 24 // 24 hours

// Types
export interface CachedMetadata {
  data: NFTMetadata
  timestamp: number
  tokenURI: string
}

export interface CachedToken {
  tokenId: string
  owner: string
  tokenURI?: string
  metadata?: NFTMetadata
  lastUpdated: number
}

export interface TokenCacheStore {
  [chainId: string]: {
    [address: string]: {
      tokens: CachedToken[]
      lastFetched: number
    }
  }
}

// Metadata Cache - Store IPFS metadata to avoid redundant fetches
export class MetadataCache {
  private static getCache(): Map<string, CachedMetadata> {
    if (typeof window === 'undefined') return new Map()

    try {
      const cached = localStorage.getItem(METADATA_CACHE_KEY)
      if (!cached) return new Map()

      const parsed = JSON.parse(cached)
      return new Map(Object.entries(parsed))
    } catch (error) {
      console.error('[MetadataCache] Error loading cache:', error)
      return new Map()
    }
  }

  private static saveCache(cache: Map<string, CachedMetadata>): void {
    if (typeof window === 'undefined') return

    try {
      const obj = Object.fromEntries(cache)
      localStorage.setItem(METADATA_CACHE_KEY, JSON.stringify(obj))
    } catch (error) {
      console.error('[MetadataCache] Error saving cache:', error)
    }
  }

  static get(tokenURI: string): NFTMetadata | null {
    const cache = this.getCache()
    const cached = cache.get(tokenURI)

    if (!cached) {
      console.log('[MetadataCache] Cache miss for:', tokenURI)
      return null
    }

    // Check if expired
    const age = Date.now() - cached.timestamp
    if (age > METADATA_TTL) {
      console.log('[MetadataCache] Cache expired for:', tokenURI)
      cache.delete(tokenURI)
      this.saveCache(cache)
      return null
    }

    console.log('[MetadataCache] Cache hit for:', tokenURI)
    return cached.data
  }

  static set(tokenURI: string, metadata: NFTMetadata): void {
    const cache = this.getCache()
    cache.set(tokenURI, {
      data: metadata,
      timestamp: Date.now(),
      tokenURI,
    })
    this.saveCache(cache)
    console.log('[MetadataCache] Cached metadata for:', tokenURI)
  }

  static clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(METADATA_CACHE_KEY)
    console.log('[MetadataCache] Cache cleared')
  }

  static clearExpired(): void {
    const cache = this.getCache()
    const now = Date.now()
    let cleared = 0

    cache.forEach((cached, key) => {
      if (now - cached.timestamp > METADATA_TTL) {
        cache.delete(key)
        cleared++
      }
    })

    if (cleared > 0) {
      this.saveCache(cache)
      console.log(`[MetadataCache] Cleared ${cleared} expired entries`)
    }
  }
}

// Token Cache - Store token ownership per chain/address
export class TokenCache {
  private static getCache(): TokenCacheStore {
    if (typeof window === 'undefined') return {}

    try {
      const cached = localStorage.getItem(TOKEN_CACHE_KEY)
      if (!cached) return {}

      return JSON.parse(cached)
    } catch (error) {
      console.error('[TokenCache] Error loading cache:', error)
      return {}
    }
  }

  private static saveCache(cache: TokenCacheStore): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.error('[TokenCache] Error saving cache:', error)
    }
  }

  static get(chainId: number, address: string): CachedToken[] | null {
    const cache = this.getCache()
    const chainCache = cache[chainId]

    if (!chainCache) {
      console.log(`[TokenCache] No cache for chain ${chainId}`)
      return null
    }

    const userCache = chainCache[address.toLowerCase()]
    if (!userCache) {
      console.log(`[TokenCache] No cache for address ${address} on chain ${chainId}`)
      return null
    }

    console.log(`[TokenCache] Cache hit for ${address} on chain ${chainId}: ${userCache.tokens.length} tokens`)
    return userCache.tokens
  }

  static set(chainId: number, address: string, tokens: CachedToken[]): void {
    const cache = this.getCache()

    if (!cache[chainId]) {
      cache[chainId] = {}
    }

    cache[chainId][address.toLowerCase()] = {
      tokens,
      lastFetched: Date.now(),
    }

    this.saveCache(cache)
    console.log(`[TokenCache] Cached ${tokens.length} tokens for ${address} on chain ${chainId}`)
  }

  static removeToken(chainId: number, address: string, tokenId: string): void {
    const cache = this.getCache()
    const chainCache = cache[chainId]

    if (!chainCache) return

    const userCache = chainCache[address.toLowerCase()]
    if (!userCache) return

    userCache.tokens = userCache.tokens.filter(t => t.tokenId !== tokenId)
    userCache.lastFetched = Date.now()

    this.saveCache(cache)
    console.log(`[TokenCache] Removed token ${tokenId} from cache for ${address} on chain ${chainId}`)
  }

  static addToken(chainId: number, address: string, token: CachedToken): void {
    const cache = this.getCache()

    if (!cache[chainId]) {
      cache[chainId] = {}
    }

    if (!cache[chainId][address.toLowerCase()]) {
      cache[chainId][address.toLowerCase()] = {
        tokens: [],
        lastFetched: Date.now(),
      }
    }

    const userCache = cache[chainId][address.toLowerCase()]

    // Check if token already exists
    const existingIndex = userCache.tokens.findIndex(t => t.tokenId === token.tokenId)
    if (existingIndex >= 0) {
      userCache.tokens[existingIndex] = token
    } else {
      userCache.tokens.push(token)
    }

    userCache.lastFetched = Date.now()
    this.saveCache(cache)
    console.log(`[TokenCache] Added/updated token ${token.tokenId} for ${address} on chain ${chainId}`)
  }

  static clear(chainId?: number, address?: string): void {
    if (typeof window === 'undefined') return

    if (!chainId) {
      localStorage.removeItem(TOKEN_CACHE_KEY)
      console.log('[TokenCache] Cleared all cache')
      return
    }

    const cache = this.getCache()

    if (!address) {
      delete cache[chainId]
      this.saveCache(cache)
      console.log(`[TokenCache] Cleared cache for chain ${chainId}`)
      return
    }

    if (cache[chainId]) {
      delete cache[chainId][address.toLowerCase()]
      this.saveCache(cache)
      console.log(`[TokenCache] Cleared cache for ${address} on chain ${chainId}`)
    }
  }

  static getLastFetchTime(chainId: number, address: string): number | null {
    const cache = this.getCache()
    const chainCache = cache[chainId]

    if (!chainCache) return null

    const userCache = chainCache[address.toLowerCase()]
    if (!userCache) return null

    return userCache.lastFetched
  }
}

// Cache invalidation helpers
export function invalidateTokenCache(chainId: number, address: string, tokenId: string) {
  console.log(`[Cache] Invalidating token ${tokenId} on chain ${chainId}`)
  TokenCache.removeToken(chainId, address, tokenId)
}

export function invalidateAllTokensForAddress(chainId: number, address: string) {
  console.log(`[Cache] Invalidating all tokens for ${address} on chain ${chainId}`)
  TokenCache.clear(chainId, address)
}

export function clearAllCaches() {
  console.log('[Cache] Clearing all caches')
  MetadataCache.clear()
  TokenCache.clear()
}

// Utility to clean up expired metadata on app init
export function initializeCache() {
  if (typeof window === 'undefined') return

  console.log('[Cache] Initializing cache...')
  MetadataCache.clearExpired()
}
