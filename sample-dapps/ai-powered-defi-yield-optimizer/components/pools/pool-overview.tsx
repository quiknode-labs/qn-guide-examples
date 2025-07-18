"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DetailedPool } from "@/types/pool";
import { EnhancedPoolCard } from "./enhanced-pool-card";
import { aerodromeApi } from "@/lib/api";
import { mockPools } from "@/lib/mock-data";
import { hasAnyToken } from "@/lib/utils";
import { Wifi, WifiOff, Shield, AlertTriangle, Filter } from "lucide-react";

interface PoolOverviewProps {
  onStartQuiz: () => void;
  onPoolsLoaded?: (pools: DetailedPool[]) => void;
}

export function PoolOverview({ onStartQuiz, onPoolsLoaded }: PoolOverviewProps) {
  const initialDisplayCount = 8; // Initial number of pools to display
  const [allPools, setAllPools] = useState<DetailedPool[]>([]);
  const [filteredPools, setFilteredPools] = useState<DetailedPool[]>([]);
  const [sortBy, setSortBy] = useState<"tvl" | "apr" | "volume">("tvl");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(initialDisplayCount);
  const [usingMockData, setUsingMockData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePools, setHasMorePools] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<{
    totalFetched: number;
    verifiedCount: number;
    listedTokensCount: number;
  } | null>(null);
  const [rawApiOffset, setRawApiOffset] = useState(0);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    cbTokensOnly: false,
    stableOnly: false,
    volatileOnly: false,
    concentratedOnly: false,
  });

  console.log("All Pools:", allPools);

  useEffect(() => {
    const loadPools = async () => {
      setLoading(true);
      setError(null);
      setVerificationStatus(null);
      setRawApiOffset(0); // Reset offset when reloading

      try {
        // Try to fetch from real API first
        console.log("Loading pools with verification...");

        const result = await aerodromeApi.getPoolsDetailed({
          limit: 20, // Fetch more initially to account for filtering
          sort_by: sortBy,
          order: "desc",
          offset: 0,
        });

        setAllPools(result.pools);
        setUsingMockData(false);
        setHasMorePools(result.hasMore);
        setRawApiOffset(result.nextOffset);
        
        // Notify parent component about loaded pools
        onPoolsLoaded?.(result.pools);

        // Get verification stats
        const listedTokens = await aerodromeApi.getListedTokens();
        setVerificationStatus({
          totalFetched: result.pools.length,
          verifiedCount: result.pools.length, // All returned pools are verified
          listedTokensCount: listedTokens.size,
        });
      } catch (err) {
        console.warn("Failed to fetch from API, using mock data:", err);

        // Fallback to mock data
        const sortedPools = [...mockPools].sort((a, b) => {
          switch (sortBy) {
            case "tvl":
              return b.liquidity.tvl - a.liquidity.tvl;
            case "apr":
              return b.trading.apr - a.trading.apr;
            case "volume":
              return b.trading.volume_24h - a.trading.volume_24h;
            default:
              return 0;
          }
        });

        setAllPools(sortedPools);
        setUsingMockData(true);
        setHasMorePools(false);
        setError(
          "Using demo data. Configure NEXT_PUBLIC_QUICKNODE_ENDPOINT to connect to live API."
        );
        
        // Notify parent component about loaded pools (even if mock)
        onPoolsLoaded?.(sortedPools);
      } finally {
        setLoading(false);
      }
    };

    loadPools();
  }, [sortBy]);

  // Apply filters whenever pools or filters change
  useEffect(() => {
    let filtered = [...allPools];

    // Apply CB token filter
    if (filters.cbTokensOnly) {
      filtered = filtered.filter((pool) => hasAnyToken(pool, ["cb"]));
    }

    // Apply pool type filters
    if (filters.stableOnly) {
      filtered = filtered.filter((pool) => pool.type_info.is_stable);
    }
    if (filters.volatileOnly) {
      filtered = filtered.filter(
        (pool) => !pool.type_info.is_stable && !pool.type_info.is_cl
      );
    }
    if (filters.concentratedOnly) {
      filtered = filtered.filter((pool) => pool.type_info.is_cl);
    }

    setFilteredPools(filtered);
  }, [allPools, filters]);

  const loadMorePools = async () => {
    if (usingMockData) {
      setDisplayCount((prev) => prev + initialDisplayCount);
      return;
    }

    setLoadingMore(true);
    try {
      const result = await aerodromeApi.getPoolsDetailed({
        limit: 10,
        offset: rawApiOffset,
        sort_by: sortBy,
        order: "desc",
      });

      if (result.pools.length > 0) {
        setAllPools((prev) => {
          // Create a Set of existing pool addresses to prevent duplicates
          const existingAddresses = new Set(prev.map(pool => pool.address));
          // Filter out any pools that already exist
          const newPools = result.pools.filter(pool => !existingAddresses.has(pool.address));
          return [...prev, ...newPools];
        });
        setHasMorePools(result.hasMore);
        setRawApiOffset(result.nextOffset);
      } else {
        setHasMorePools(false);
      }
    } catch (err) {
      console.error("Failed to load more pools:", err);
      setHasMorePools(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (
    filterKey: keyof typeof filters,
    checked: boolean
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: checked,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      cbTokensOnly: false,
      stableOnly: false,
      volatileOnly: false,
      concentratedOnly: false,
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const poolsToShow = filteredPools.slice(0, displayCount);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Top Aerodrome Pools
          </h2>
          <p className="text-gray-600">
            Discover high-yield liquidity opportunities on Base
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 px-1.5 py-0.5 text-xs bg-blue-600">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          <Select
            value={sortBy}
            onValueChange={(value: "tvl" | "apr" | "volume") =>
              setSortBy(value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tvl">Sort by TVL</SelectItem>
              <SelectItem value="apr">Sort by APR</SelectItem>
              <SelectItem value="volume">Sort by Volume</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={onStartQuiz}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Build My Strategy
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Filter Pools</h3>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cbTokens"
                checked={filters.cbTokensOnly}
                onCheckedChange={(checked) =>
                  handleFilterChange("cbTokensOnly", checked as boolean)
                }
              />
              <Label htmlFor="cbTokens" className="text-sm font-medium">
                CB Tokens Only
                <p className="text-xs text-gray-600">
                  Pools with Coinbase tokens
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="stable"
                checked={filters.stableOnly}
                onCheckedChange={(checked) =>
                  handleFilterChange("stableOnly", checked as boolean)
                }
              />
              <Label htmlFor="stable" className="text-sm font-medium">
                Stable Pools
                <p className="text-xs text-gray-600">Low volatility pairs</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="volatile"
                checked={filters.volatileOnly}
                onCheckedChange={(checked) =>
                  handleFilterChange("volatileOnly", checked as boolean)
                }
              />
              <Label htmlFor="volatile" className="text-sm font-medium">
                Volatile Pools
                <p className="text-xs text-gray-600">
                  Higher risk/reward pairs
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="concentrated"
                checked={filters.concentratedOnly}
                onCheckedChange={(checked) =>
                  handleFilterChange("concentratedOnly", checked as boolean)
                }
              />
              <Label htmlFor="concentrated" className="text-sm font-medium">
                Concentrated Liquidity
                <p className="text-xs text-gray-600">Advanced LP strategies</p>
              </Label>
            </div>
          </div>

        </div>
      )}

      {/* API Status Alerts */}
      {error && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Badge variant="secondary">Demo Mode</Badge>
          </AlertDescription>
        </Alert>
      )}

      {!error && !usingMockData && (
        <Alert className="border-green-200 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <span>
                Connected to QuickNode Aerodrome API - Live verified pools
              </span>
              {verificationStatus && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    <Shield className="w-3 h-3 mr-1" />
                    {verificationStatus.listedTokensCount} verified tokens
                  </Badge>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}


      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: initialDisplayCount }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white rounded-lg border p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {poolsToShow.map((pool) => (
              <EnhancedPoolCard key={pool.address} pool={pool} />
            ))}
          </div>

          {filteredPools.length === 0 && allPools.length > 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pools match your filters
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filter criteria to see more pools.
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          )}

          {hasMorePools && filteredPools.length > displayCount && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() =>
                  setDisplayCount((prev) => prev + initialDisplayCount)
                }
                className="px-8 bg-transparent"
              >
                Show More Pools
              </Button>
            </div>
          )}

          {hasMorePools &&
            !usingMockData &&
            filteredPools.length <= displayCount && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMorePools}
                  className="px-8 bg-transparent"
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Loading More...
                    </>
                  ) : (
                    "Load More Pools"
                  )}
                </Button>
              </div>
            )}

          {!hasMorePools && poolsToShow.length > 0 && (
            <div className="text-center text-gray-500 text-sm">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              All verified pools loaded
            </div>
          )}
        </>
      )}
    </div>
  );
}
