import type { RiskProfile, OptimizedStrategy, PoolRecommendation } from "@/types/strategy";
import type { DetailedPool } from "@/types/pool";

interface AIOptimizationRequest {
  pools: DetailedPool[];
  riskProfile: RiskProfile;
}

interface AIPoolAnalysis {
  pool: DetailedPool;
  allocation: number;
  reasoning: string[];
  riskScore: number;
  expectedReturn: number;
}

interface AIOptimizationResponse {
  recommendations: AIPoolAnalysis[];
  portfolioSummary: {
    expectedAPR: number;
    riskScore: number;
    diversificationScore: number;
    reasoning: string[];
  };
}

const POOL_CATEGORIES = {
  stable: "Low-risk stable pairs with minimal impermanent loss",
  major: "Established tokens with good liquidity and moderate risk",
  volatile: "Higher risk/reward pairs with potential for greater returns",
  concentrated: "Advanced liquidity strategies requiring active management"
};

const RISK_TOLERANCE_DESCRIPTIONS = {
  conservative: "Prefers stable returns with minimal risk, focusing on capital preservation",
  moderate: "Balanced approach seeking reasonable returns with controlled risk",
  aggressive: "Willing to accept higher risk for potentially greater rewards"
};

const TIME_HORIZON_DESCRIPTIONS = {
  short: "Short-term investment (1-3 months) requiring high liquidity",
  medium: "Medium-term investment (3-6 months) with balanced growth approach",
  long: "Long-term investment (6+ months) focused on maximum growth potential"
};

/**
 * Generate an AI-powered portfolio optimization using a structured prompt
 */
export async function generateAIOptimizedStrategy(
  pools: DetailedPool[],
  riskProfile: RiskProfile
): Promise<OptimizedStrategy> {
  try {
    // Use Claude's own API for optimization
    const aiResponse = await callAIOptimizer({ pools, riskProfile });
    
    // Convert AI response to our expected format
    const recommendations: PoolRecommendation[] = aiResponse.recommendations.map(rec => ({
      pool: rec.pool,
      allocation: rec.allocation,
      reasoning: rec.reasoning,
      riskScore: rec.riskScore,
      expectedReturn: rec.expectedReturn
    }));

    const portfolioMetrics = {
      expectedAPR: aiResponse.portfolioSummary.expectedAPR,
      riskScore: aiResponse.portfolioSummary.riskScore,
      diversificationScore: aiResponse.portfolioSummary.diversificationScore,
      totalTVL: recommendations.reduce((sum, rec) => sum + rec.pool.liquidity.tvl, 0)
    };

    return {
      recommendations,
      portfolioMetrics,
      reasoning: aiResponse.portfolioSummary.reasoning
    };
  } catch (error) {
    console.error("AI optimization failed:", error);
    throw error;
  }
}

/**
 * Call Claude AI service for portfolio optimization via API route
 */
async function callAIOptimizer(request: AIOptimizationRequest): Promise<AIOptimizationResponse> {
  try {
    const response = await fetch('/api/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pools: request.pools,
        riskProfile: request.riskProfile
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    if (data.fallback || !data.success) {
      // API indicated to use fallback
      throw new Error(data.error || 'AI service unavailable');
    }

    // Convert API response to our expected format
    return {
      recommendations: data.optimization.recommendations.map((rec: any) => ({
        pool: rec.pool,
        allocation: rec.allocation,
        reasoning: rec.reasoning,
        riskScore: rec.riskScore,
        expectedReturn: rec.expectedReturn
      })),
      portfolioSummary: {
        expectedAPR: data.optimization.portfolioSummary.expectedAPR,
        riskScore: data.optimization.portfolioSummary.riskScore,
        diversificationScore: data.optimization.portfolioSummary.diversificationScore,
        reasoning: data.optimization.portfolioSummary.reasoning
      }
    };
  } catch (error) {
    console.warn("Claude API call failed:", error);
    throw error;
  }
}




