import type {
  RiskProfile,
  OptimizedStrategy,
  PoolRecommendation,
} from "@/types/strategy";
import type { DetailedPool } from "@/types/pool";
import { generateAIOptimizedStrategy } from "./ai-optimizer";
import { aerodromeApi } from "./api";
import { mockPools } from "./mock-data";

export async function generateOptimizedStrategy(
  riskProfile: RiskProfile,
  pools?: DetailedPool[]
): Promise<OptimizedStrategy> {
  let availablePools: DetailedPool[];
  
  // Use provided pools or fetch from API
  if (pools && pools.length > 0) {
    availablePools = pools;
  } else {
    try {
      // Fetch fresh pool data from API
      const result = await aerodromeApi.getPoolsDetailed({
        limit: 50, // Get more pools for better optimization
        sort_by: "tvl",
        order: "desc",
        offset: 0,
      });
      availablePools = result.pools;
    } catch (error) {
      console.warn("Failed to fetch pools from API, using mock data:", error);
      availablePools = mockPools;
    }
  }

  // Use AI-powered optimization
  return await generateAIOptimizedStrategy(availablePools, riskProfile);
}

