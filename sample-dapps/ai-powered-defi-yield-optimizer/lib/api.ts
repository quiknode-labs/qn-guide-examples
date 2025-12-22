// API client for Quicknode Aerodrome Swap API
import type { DetailedPool } from "@/types/pool"
import type { TokensResponse } from "@/types/token";

interface PoolsDetailedParams {
  target?: string
  limit?: number
  offset?: number
  sort_by?: "tvl" | "apr" | "volume"
  order?: "asc" | "desc"
}

interface PricesParams {
  symbols?: string[]
}

interface TokensParams {
  target?: string
  limit?: number
  offset?: number
  listed_only?: boolean
}

export class AerodromeAPI {
  private baseUrl: string;
  private listedTokensCache: Set<string> | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_QUICKNODE_ENDPOINT || "";
  }

  private async request<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}addon/1051/v1${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getListedTokens(): Promise<Set<string>> {
    // Check cache validity
    const now = Date.now();
    if (
      this.listedTokensCache &&
      now - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return this.listedTokensCache;
    }

    console.log("Fetching listed tokens from API...");

    const listedTokens = new Set<string>();
    let offset = 0;
    let hasMore = true;

    // Fetch all listed tokens with pagination
    while (hasMore) {
      try {
        const response: TokensResponse = await this.request("/tokens", {
          target: "aero",
          listed_only: true,
          limit: 100, // Fetch in batches of 100
          offset,
        });

        // Add token addresses to the set (lowercase for case-insensitive comparison)
        response.tokens.forEach((token) => {
          listedTokens.add(token.address.toLowerCase());
        });

        hasMore = response.has_more;
        offset += response.limit;

        console.log(
          `Fetched ${response.tokens.length} listed tokens (total: ${listedTokens.size})`
        );
      } catch (error) {
        console.error("Failed to fetch listed tokens:", error);
        break;
      }
    }

    // Update cache
    this.listedTokensCache = listedTokens;
    this.cacheTimestamp = now;

    console.log(`Cached ${listedTokens.size} listed tokens`);
    return listedTokens;
  }

  private isPoolVerified(
    pool: DetailedPool,
    listedTokens: Set<string>
  ): boolean {
    const token0Listed = listedTokens.has(
      pool.tokens.token0.address.toLowerCase()
    );
    const token1Listed = listedTokens.has(
      pool.tokens.token1.address.toLowerCase()
    );
    return token0Listed && token1Listed;
  }

  async getPoolsDetailed(
    params: PoolsDetailedParams = {}
  ): Promise<{ pools: DetailedPool[]; nextOffset: number; hasMore: boolean }> {
    const defaultParams = {
      target: "aero",
      limit: 60,
      sort_by: "tvl",
      order: "desc",
      ...params,
    };

    // Get listed tokens first
    const listedTokens = await this.getListedTokens();

    const allPools: DetailedPool[] = [];
    let offset = params.offset || 0;
    const targetCount = params.limit || 10;
    let totalFetched = 0;

    // Keep fetching until we have enough verified pools or no more pools available
    while (allPools.length < targetCount) {
      try {
        const fetchParams = {
          ...defaultParams,
          limit: Math.max(60, targetCount * 3),
          offset,
        };

        const pools: DetailedPool[] = await this.request(
          "/pools/detailed",
          fetchParams
        );

        totalFetched += pools.length;

        if (pools.length === 0) {
          // No more pools available
          return { pools: allPools, nextOffset: offset, hasMore: false };
        }

        // Filter pools to only include those with both tokens listed
        const verifiedPools = pools.filter((pool) =>
          this.isPoolVerified(pool, listedTokens)
        );

        allPools.push(...verifiedPools);
        offset += pools.length;

        console.log(
          `Fetched ${pools.length} pools, ${verifiedPools.length} verified, total verified: ${allPools.length}`
        );

        // Break if we got fewer pools than requested (likely end of data)
        if (pools.length < fetchParams.limit) {
          return { pools: allPools.slice(0, targetCount), nextOffset: offset, hasMore: false };
        }
      } catch (error) {
        console.error("Failed to fetch pools:", error);
        return { pools: allPools, nextOffset: offset, hasMore: false };
      }
    }

    // Return the requested number of pools
    return { 
      pools: allPools.slice(0, targetCount), 
      nextOffset: offset, 
      hasMore: true 
    };
  }

  async getPrices(params: PricesParams = {}) {
    return this.request("/prices", params);
  }

  async getTokens(params: TokensParams = {}) {
    return this.request("/tokens", params);
  }

  async getQuote(params: any) {
    const defaultParams = {
      target: "aero",
      ...params,
    };
    return this.request("/tokens", defaultParams);
  }

  // Method to clear cache (useful for development/testing)
  clearTokenCache() {
    this.listedTokensCache = null;
    this.cacheTimestamp = 0;
  }
}

export const aerodromeApi = new AerodromeAPI()
