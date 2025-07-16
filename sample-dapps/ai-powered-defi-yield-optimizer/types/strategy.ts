import type { DetailedPool } from "./pool"

export interface RiskProfile {
  investmentAmount: number
  riskTolerance: "conservative" | "moderate" | "aggressive"
  timeHorizon: "short" | "medium" | "long"
  minTVL: number
  poolTypes: string[]
}

export interface PoolRecommendation {
  pool: DetailedPool
  allocation: number // percentage
  reasoning: string[]
  riskScore: number
  expectedReturn: number
}

export interface OptimizedStrategy {
  recommendations: PoolRecommendation[]
  portfolioMetrics: {
    expectedAPR: number
    riskScore: number
    diversificationScore: number
    totalTVL: number
  }
  reasoning: string[]
}
