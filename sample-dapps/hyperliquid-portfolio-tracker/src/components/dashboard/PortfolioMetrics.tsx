import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { BarChart3 } from 'lucide-react';

import { UserRateLimit, UserVaultEquity, Delegation } from '../../shared/types';

interface PortfolioMetricsProps {
  totalAccountValue: number;
  totalUnrealizedPnl: number;
  userRateLimit: UserRateLimit | null;
  vaultEquities: UserVaultEquity[];
  delegations: Delegation[];
  formatCurrency: (value: number) => string;
}

export const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({
  totalAccountValue,
  totalUnrealizedPnl,
  userRateLimit,
  vaultEquities,
  delegations,
  formatCurrency
}) => {
  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white">
          Portfolio Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* First Row - Main Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Account Value */}
          <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-600/40 rounded-2xl p-6 text-center hover:from-slate-700/80 hover:to-slate-800/60 hover:border-slate-500/60 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="text-xs text-slate-400 mb-3 font-medium tracking-wide uppercase">
                Perp Account Value
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-blue-100 transition-colors duration-300">{formatCurrency(totalAccountValue)}</div>
            </div>
          </div>

          {/* Cumulative Volume */}
          <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-600/40 rounded-2xl p-6 text-center hover:from-slate-700/80 hover:to-slate-800/60 hover:border-slate-500/60 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="text-xs text-slate-400 mb-3 font-medium tracking-wide uppercase">
                Cumulative Perp Volume
              </div>
              <div className="min-h-[2rem] flex items-center justify-center">
                {userRateLimit ? (
                  <div className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                    {formatCurrency(userRateLimit.cum_vlm)}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-8 h-8 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-slate-600/50 transition-colors duration-300">
                      <BarChart3 className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-400">No volume data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Total Unrealized PnL */}
          <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-600/40 rounded-2xl p-6 text-center hover:from-slate-700/80 hover:to-slate-800/60 hover:border-slate-500/60 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10">
            <div className={`absolute inset-0 bg-gradient-to-br ${totalUnrealizedPnl >= 0 ? 'from-emerald-500/5' : 'from-red-500/5'} to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            <div className="relative z-10">
              <div className="text-xs text-slate-400 mb-3 font-medium tracking-wide uppercase">
                Unrealized PnL
              </div>
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                totalUnrealizedPnl >= 0
                  ? 'text-emerald-400 group-hover:text-emerald-300'
                  : 'text-red-400 group-hover:text-red-300'
              }`}>
                {formatCurrency(totalUnrealizedPnl)}
              </div>
            </div>
          </div>

          </div>

          {/* Second Row - Vault & Staking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Vault Value */}
            <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-600/40 rounded-2xl p-6 text-center hover:from-slate-700/80 hover:to-slate-800/60 hover:border-slate-500/60 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-xs text-slate-400 mb-3 font-medium tracking-wide uppercase">
                  Total Vault Value
                </div>
                <div className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                  {formatCurrency(vaultEquities.reduce((sum, vault) => sum + vault.equity, 0))}
                </div>
              </div>
            </div>

            {/* Total Staked Amount */}
            <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-600/40 rounded-2xl p-6 text-center hover:from-slate-700/80 hover:to-slate-800/60 hover:border-slate-500/60 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-xs text-slate-400 mb-3 font-medium tracking-wide uppercase">
                 Total Staked Amount
                </div>
                <div className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                  {delegations.reduce((sum, delegation) => sum + delegation.amount, 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} HYPE
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};