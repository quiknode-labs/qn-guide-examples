import React from 'react';
import { Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { AssetPosition } from '../../shared/types';

interface ActivePositionsTableProps {
  positions: AssetPosition[];
  formatCurrency: (value: number) => string;
}

export const ActivePositionsTable: React.FC<ActivePositionsTableProps> = ({
  positions,
  formatCurrency
}) => {
  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          Active Positions
          {positions.length > 0 && (
            <Badge className="bg-emerald-500/20 border-emerald-500/50 text-emerald-400">
              {positions.length} Positions
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Asset</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Size</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Entry Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Position Value</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">PnL</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Liquidation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Leverage</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {positions.map((position) => (
                  <tr key={position.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="font-bold text-white text-sm">{position.coin}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        className={position.size > 0 ?
                          "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30" :
                          "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                        }
                      >
                        {position.size > 0 ? "LONG" : "SHORT"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white font-mono text-sm">{Math.abs(position.size).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 5})}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-300 font-mono text-sm">{formatCurrency(position.entry_price)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white font-semibold text-sm">{formatCurrency(position.position_value)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`font-bold text-sm ${
                        position.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(position.unrealized_pnl)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-red-400 font-mono text-sm font-medium">
                        {position.liquidation_price ? formatCurrency(position.liquidation_price) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white font-bold text-sm">{position.leverage_value}x</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={position.leverage_type === 'cross' ?
                          "border-blue-500/50 text-blue-400 bg-blue-500/10" :
                          "border-amber-500/50 text-amber-400 bg-amber-500/10"
                        }
                      >
                        {position.leverage_type}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-400">No active positions</p>
              <p className="text-xs text-slate-500">Positions will appear when you have open trades</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};