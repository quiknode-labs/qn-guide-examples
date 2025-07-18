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




