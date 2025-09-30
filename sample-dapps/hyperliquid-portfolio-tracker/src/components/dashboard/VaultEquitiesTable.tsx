import React from 'react';
import { Wallet, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { UserVaultEquity } from '../../shared/types';

interface VaultEquitiesTableProps {
  vaultEquities: UserVaultEquity[];
  formatCurrency: (value: number) => string;
}

export const VaultEquitiesTable: React.FC<VaultEquitiesTableProps> = ({
  vaultEquities,
  formatCurrency
}) => {
  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          Vault Equities
          {vaultEquities.length > 0 && (
            <Badge className="bg-purple-500/20 border-purple-500/50 text-purple-400">
              {vaultEquities.length} Vaults
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="min-h-[120px]">
          {vaultEquities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Vault Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Equity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Locked Until</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {vaultEquities.map((vault) => {
                    const isLocked = vault.locked_until_timestamp > Date.now();
                    const unlockDate = new Date(vault.locked_until_timestamp);
                    return (
                      <tr key={vault.id} className="hover:bg-slate-800/50 transition-colors group">
                        <td className="px-4 py-4">
                          <a
                            href={`https://app.hyperliquid.xyz/vaults/${vault.vault_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-1 group"
                          >
                            {vault.vault_address.slice(0, 8)}...{vault.vault_address.slice(-6)}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </a>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-white font-semibold text-sm">
                            {formatCurrency(vault.equity)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-slate-300 text-sm">
                            {unlockDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) + ', ' + unlockDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false})}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`${
                            isLocked
                              ? 'bg-red-500/20 border-red-500/50 text-red-400'
                              : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          }`}>
                            {isLocked ? 'Locked' : 'Unlocked'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-400">No vault deposits</p>
                <p className="text-xs text-slate-500">Vault information will appear when you make deposits</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};