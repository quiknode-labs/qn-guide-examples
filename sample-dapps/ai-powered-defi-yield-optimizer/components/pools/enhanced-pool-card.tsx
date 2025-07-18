"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DetailedPool } from "@/types/pool";
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatTokenSymbol,
  getTokenExplorerUrl,
  isCBToken,
} from "@/lib/utils";
import {
  TrendingUp,
  Droplets,
  Zap,
  Vote,
  Coins,
  BarChart3,
  DollarSign,
  Users,
  ExternalLink,
} from "lucide-react";

interface EnhancedPoolCardProps {
  pool: DetailedPool;
  variant?: "overview" | "recommendation";
  showActions?: boolean;
}

export function EnhancedPoolCard({
  pool,
  variant = "overview",
  showActions = false,
}: EnhancedPoolCardProps) {
  const getPoolTypeIcon = (pool: DetailedPool) => {
    if (pool.type_info.is_stable) return <Droplets className="w-4 h-4" />;
    if (pool.type_info.is_cl) return <Zap className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  const getPoolTypeLabel = (pool: DetailedPool) => {
    if (pool.type_info.is_stable) return "Stable";
    if (pool.type_info.is_cl) return "Concentrated";
    return "Volatile";
  };

  const getRiskColor = (apr: number) => {
    if (!apr || apr < 10) return "bg-green-100 text-green-800";
    if (apr < 25) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const hasCBToken =
    isCBToken(pool.tokens.token0.symbol) ||
    isCBToken(pool.tokens.token1.symbol);

  const TokenLink = ({
    token,
    className = "",
  }: {
    token: { address: string; symbol: string };
    className?: string;
  }) => (
    <a
      href={getTokenExplorerUrl(token.address)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 hover:text-blue-600 transition-colors ${className}`}
      title={`View ${token.symbol} on BaseScan`}
    >
      <span className="truncate">{formatTokenSymbol(token.symbol)}</span>
      <ExternalLink className="w-3 h-3 flex-shrink-0" />
    </a>
  );

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01] h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle
              className="text-sm font-semibold truncate"
              title={pool.symbol}
            >
              {pool.symbol}
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
              <TokenLink token={pool.tokens.token0} />
              <span>/</span>
              <TokenLink token={pool.tokens.token1} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1">
              {getPoolTypeIcon(pool)}
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {getPoolTypeLabel(pool)}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1 py-0">
                {pool.trading.pool_fee_percentage}% fee
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Primary Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-gray-600">TVL</p>
            </div>
            <p
              className="font-semibold text-sm truncate"
              title={formatCurrency(pool.liquidity.tvl)}
            >
              {formatCurrency(pool.liquidity.tvl)}
            </p>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600 flex-shrink-0" />
              <p className="text-xs text-gray-600">APR</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm">
                {formatPercentage(pool.trading.apr)}
              </p>
              <Badge
                className={`text-xs px-1 py-0 flex-shrink-0 ${getRiskColor(
                  pool.trading.apr
                )}`}
              >
                {!pool.trading.apr || pool.trading.apr < 10
                  ? "Low"
                  : pool.trading.apr < 25
                  ? "Med"
                  : "High"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Trading Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-purple-600 flex-shrink-0" />
              <p className="text-gray-600">24h Volume</p>
            </div>
            <p
              className="font-medium truncate"
              title={formatCurrency(pool.trading.volume_24h)}
            >
              {formatCurrency(pool.trading.volume_24h)}
            </p>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-orange-600 flex-shrink-0" />
              <p className="text-gray-600">24h Fees</p>
            </div>
            <p
              className="font-medium truncate"
              title={formatCurrency(pool.trading.fees_24h)}
            >
              {formatCurrency(pool.trading.fees_24h)}
            </p>
          </div>
        </div>

        {/* Reserves */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-600 flex-shrink-0" />
            <p className="text-xs text-gray-600">Pool Reserves</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded p-2 min-w-0">
              <div className="flex items-center gap-1">
                <p
                  className="text-gray-600 truncate"
                  title={pool.tokens.token0.symbol}
                >
                  {formatTokenSymbol(pool.tokens.token0.symbol)}
                </p>
                {isCBToken(pool.tokens.token0.symbol) && (
                  <Badge className="text-xs px-1 py-0 bg-blue-100 text-blue-800">
                    CB
                  </Badge>
                )}
              </div>
              <p
                className="font-medium truncate"
                title={formatNumber(pool.liquidity.reserves.token0_amount)}
              >
                {formatNumber(pool.liquidity.reserves.token0_amount)}
              </p>
            </div>
            <div className="bg-gray-50 rounded p-2 min-w-0">
              <div className="flex items-center gap-1">
                <p
                  className="text-gray-600 truncate"
                  title={pool.tokens.token1.symbol}
                >
                  {formatTokenSymbol(pool.tokens.token1.symbol)}
                </p>
                {isCBToken(pool.tokens.token1.symbol) && (
                  <Badge className="text-xs px-1 py-0 bg-blue-100 text-blue-800">
                    CB
                  </Badge>
                )}
              </div>
              <p
                className="font-medium truncate"
                title={formatNumber(pool.liquidity.reserves.token1_amount)}
              >
                {formatNumber(pool.liquidity.reserves.token1_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Emissions & Voting */}
        <div className="pt-2 border-t space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                <p className="text-gray-600">Weekly Emissions</p>
              </div>
              <p className="font-medium truncate">
                {formatCurrency(pool.gauge?.weekly_emissions || 0)}
              </p>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1">
                <Vote className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                <p className="text-gray-600">Total Votes</p>
              </div>
              <p className="font-medium truncate">
                {pool.voting?.votes
                  ? formatNumber(Number.parseFloat(pool.voting.votes) / 1e18)
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Voting Rewards Breakdown - Only show if voting data exists */}
          {pool.voting?.rewards && (
            <div className="bg-blue-50 rounded p-2 space-y-1">
              <p className="text-xs font-medium text-blue-900">
                Voting Rewards
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="min-w-0">
                  <p className="text-blue-700 truncate">
                    Fees:{" "}
                    {formatCurrency(pool.voting.rewards.fees.total_usd || 0)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-blue-700 truncate">
                    Incentives:{" "}
                    {formatCurrency(
                      pool.voting.rewards.incentives.total_usd || 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {showActions && (
          <div className="pt-2">
            <Button className="w-full" size="sm">
              Add to Strategy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
