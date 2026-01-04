"use client"

import { useState } from "react"
import { PoolOverview } from "@/components/pools/pool-overview"
import { RiskAssessmentQuiz } from "@/components/quiz/risk-assessment-quiz"
import { StrategyResults } from "@/components/strategy/strategy-results"
import type { RiskProfile, OptimizedStrategy } from "@/types/strategy"
import type { DetailedPool } from "@/types/pool"

export default function Home() {
  const [currentStep, setCurrentStep] = useState<"pools" | "quiz" | "results">("pools")
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null)
  const [strategy, setStrategy] = useState<OptimizedStrategy | null>(null)
  const [poolData, setPoolData] = useState<DetailedPool[]>([])

  const handlePoolsLoaded = (pools: DetailedPool[]) => {
    setPoolData(pools)
  }

  const handleStartQuiz = () => {
    setCurrentStep("quiz")
  }

  const handleQuizComplete = (profile: RiskProfile) => {
    setRiskProfile(profile)
    setCurrentStep("results")
  }

  const handleBackToPools = () => {
    setCurrentStep("pools")
    setRiskProfile(null)
    setStrategy(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI-Powered DeFi Yield Optimizer
              </h1>
              <p className="text-gray-600 mt-1">
                Optimize your DeFi yield farming across Aerodrome pools on Base
                with AI
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://marketplace.quicknode.com/add-on/aerodrome-swap-api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Powered by Quicknode Aerodrome API
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === "pools" && (
          <PoolOverview
            onStartQuiz={handleStartQuiz}
            onPoolsLoaded={handlePoolsLoaded}
          />
        )}

        {currentStep === "quiz" && (
          <RiskAssessmentQuiz
            onComplete={handleQuizComplete}
            onBack={handleBackToPools}
          />
        )}

        {currentStep === "results" && riskProfile && (
          <StrategyResults
            riskProfile={riskProfile}
            onBack={handleBackToPools}
            poolData={poolData}
          />
        )}
      </main>
    </div>
  );
}
