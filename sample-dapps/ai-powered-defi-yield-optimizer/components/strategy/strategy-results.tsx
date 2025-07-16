"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { RiskProfile, OptimizedStrategy } from "@/types/strategy";
import type { DetailedPool } from "@/types/pool";
import { generateOptimizedStrategy } from "@/lib/optimizer";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowLeft, Target, TrendingUp, Shield, Zap } from "lucide-react";

interface StrategyResultsProps {
  riskProfile: RiskProfile;
  onBack: () => void;
  poolData: DetailedPool[];
}

export function StrategyResults({
  riskProfile,
  onBack,
  poolData,
}: StrategyResultsProps) {
  const [strategy, setStrategy] = useState<OptimizedStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateStrategy = async () => {
      setLoading(true);
      setError(null);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        const optimizedStrategy = await generateOptimizedStrategy(
          riskProfile,
          poolData
        );
        setStrategy(optimizedStrategy);
      } catch (error) {
        console.error("Failed to generate strategy:", error);
        setError("Failed to generate optimized strategy. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    generateStrategy();
  }, [riskProfile, poolData]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h3 className="text-lg font-semibold">
                {"Claude AI Optimizing Strategy..."}
              </h3>
              <p className="text-gray-600">
                {`Claude AI analyzing your risk profile against ${poolData.length} real-time pools`}
              </p>
              <Progress value={75} className="w-full max-w-md mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-red-600">
                Optimization Failed
              </h3>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!strategy) return null;

  const pieData = strategy.recommendations.map((rec, index) => ({
    name: rec.pool.symbol,
    value: rec.allocation,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
  }));

  const riskScoreColor =
    strategy.portfolioMetrics.riskScore < 30
      ? "text-green-600"
      : strategy.portfolioMetrics.riskScore < 70
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your AI-Optimized Strategy
          </h2>
          <p className="text-gray-600">
            Claude AI recommendations based on analysis of {poolData.length} pools
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pools
        </Button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected APR</CardTitle>
            <TrendingUp className="h-4 w-4 ml-auto text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(strategy.portfolioMetrics.expectedAPR)}
            </div>
            <p className="text-xs text-gray-600">
              Weighted average across all positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 ml-auto" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${riskScoreColor}`}>
              {strategy.portfolioMetrics.riskScore}/100
            </div>
            <p className="text-xs text-gray-600">
              {strategy.portfolioMetrics.riskScore < 30
                ? "Conservative"
                : strategy.portfolioMetrics.riskScore < 70
                ? "Moderate"
                : "Aggressive"}{" "}
              risk level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Diversification
            </CardTitle>
            <Target className="h-4 w-4 ml-auto text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {strategy.portfolioMetrics.diversificationScore}/100
            </div>
            <p className="text-xs text-gray-600">
              Spread across {strategy.recommendations.length} pools
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Chart and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investment Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategy.recommendations.map((rec, index) => (
              <div
                key={rec.pool.address}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: pieData[index].color }}
                  />
                  <div>
                    <div className="font-medium">{rec.pool.symbol}</div>
                    <div className="text-sm text-gray-600">
                      {formatPercentage(rec.expectedReturn)} APR
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{rec.allocation}%</div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(
                      (riskProfile.investmentAmount * rec.allocation) / 100
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {strategy.recommendations.map((rec) => (
              <div key={rec.pool.address} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{rec.pool.symbol}</h4>
                    <p className="text-gray-600">
                      {rec.pool.tokens.token0.symbol} /{" "}
                      {rec.pool.tokens.token1.symbol}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercentage(rec.expectedReturn)}
                    </div>
                    <div className="text-sm text-gray-600">Expected APR</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Allocation</p>
                    <p className="font-semibold">{rec.allocation}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Investment</p>
                    <p className="font-semibold">
                      {formatCurrency(
                        (riskProfile.investmentAmount * rec.allocation) / 100
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">TVL</p>
                    <p className="font-semibold">
                      {formatCurrency(rec.pool.liquidity.tvl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk Score</p>
                    <p className="font-semibold">{rec.riskScore}/100</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Why this pool?</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.reasoning.map((reason, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Implementation Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Connect your wallet to Aerodrome Finance</li>
                <li>Ensure you have the required tokens for each pool</li>
                <li>
                  Add liquidity to each recommended pool in the suggested
                  proportions
                </li>
                <li>Monitor your positions and rebalance regularly</li>
              </ol>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">
                Important Considerations
              </h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
                <li>
                  These are just for educational purposes. Always DYOR before
                  investing
                </li>
                <li>
                  DeFi investments carry smart contract and impermanent loss
                  risks
                </li>
                <li>
                  APRs are estimates based on current conditions and may change
                </li>
                <li>Consider gas fees when implementing smaller allocations</li>
                <li>Monitor pool performance and adjust strategy as needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
