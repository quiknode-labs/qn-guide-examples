import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { SpotBalance } from '../../shared/types';

interface SpotHoldingsGridProps {
  spotBalances: SpotBalance[];
  formatCurrency: (value: number) => string;
  COLORS: string[];
}

export const SpotHoldingsGrid: React.FC<SpotHoldingsGridProps> = ({
  spotBalances,
  formatCurrency,
  COLORS
}) => {
  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          Spot Holdings
          {spotBalances.length > 0 && (
            <Badge className="bg-emerald-500/20 border-emerald-500/50 text-emerald-400">
              {spotBalances.length} Assets
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="min-h-[200px]">
          {spotBalances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Asset</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Balance</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Cost Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {spotBalances.sort((a, b) => a.token - b.token).map((balance, index) => (
                    <tr key={`${balance.coin}-${balance.token}`} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="text-sm font-bold text-white">{balance.coin}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-semibold text-slate-200">
                          {balance.total.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3})} {balance.coin}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {balance.entry_ntl !== 0 ? (
                          <div className={`text-sm font-medium ${balance.entry_ntl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(balance.entry_ntl)}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">-</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-400">No spot balance data available</p>
                <p className="text-xs text-slate-500">Spot holdings will appear when data is available</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};