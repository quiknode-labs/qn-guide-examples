import React from 'react';
import { Activity, Copy, Check, Search, Home, X, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface WalletHeaderProps {
  currentWallet: string;
  walletInput: string;
  setWalletInput: (value: string) => void;
  copied: boolean;
  copyToClipboard: () => void;
  isSearching: boolean;
  isDataStale: boolean;
  lastUpdate: Date | null;
  error: string | null;
  handleWalletSearch: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleGoHome: () => void;
  isValidWalletAddress: (address: string) => boolean;
}

export const WalletHeader: React.FC<WalletHeaderProps> = ({
  currentWallet,
  walletInput,
  setWalletInput,
  copied,
  copyToClipboard,
  isSearching,
  isDataStale,
  lastUpdate,
  error,
  handleWalletSearch,
  handleKeyPress,
  handleGoHome,
  isValidWalletAddress
}) => {
  return (
    <div className="mb-8">
      {/* Top Navigation Bar */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Wallet Address Display */}
          <div className="flex items-end gap-2">
            <div>
              <div className="text-xs text-slate-300 font-medium tracking-wide mb-1">Connected Wallet</div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-bold text-white tracking-wide bg-slate-800/60 px-3 py-1 rounded-lg">
                  {currentWallet}
                </code>
                <button
                  onClick={copyToClipboard}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'hover:bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Search Controls & Status */}
          <div className="flex flex-col lg:items-end gap-3">
            {/* Status */}
            <div className="flex items-center gap-2">
              {isSearching ? (
                <Badge className="bg-blue-500/20 border-blue-500/50 text-blue-400 text-xs">
                  <Activity className="w-3 h-3 animate-spin mr-1" />
                  Switching
                </Badge>
              ) : (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Badge className={`text-xs cursor-help hover:bg-opacity-80 transition-all duration-200 ${
                      isDataStale
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                        : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 animate-pulse ${
                        isDataStale ? 'bg-yellow-400' : 'bg-emerald-400'
                      }`} />
                      {isDataStale ? 'Stale' : 'Live • Quicknode'}
                      <Info className="w-3 h-3 ml-1 opacity-60" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 border-slate-600 p-3 shadow-xl max-w-xs rounded-lg">
                    <div className="text-xs text-white">
                      <div className="font-semibold mb-1 text-emerald-400">Data Source</div>
                      <p className="mb-2">Powered by Quicknode's Hyperliquid Info Endpoints</p>
                      <a
                        href="https://www.quicknode.com/docs/hyperliquid/info-endpoints"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline text-xs"
                      >
                        View Docs →
                      </a>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              {lastUpdate && (
                <span className="text-xs text-slate-300 font-medium tracking-wide">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Search Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGoHome}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Home className="w-4 h-4" />
              </Button>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Switch wallet..."
                  className={`pl-8 w-[365px] h-8 text-xs bg-slate-800/80 border-slate-600 focus:ring-1 rounded-lg transition-all duration-300 ${
                    walletInput.length > 0
                      ? isValidWalletAddress(walletInput)
                        ? 'focus:border-emerald-500 focus:ring-emerald-500/20 border-emerald-500/50'
                        : 'focus:border-red-500 focus:ring-red-500/20 border-red-500/50'
                      : 'focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                {walletInput && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {isValidWalletAddress(walletInput) ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <X className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              <Button
                onClick={handleWalletSearch}
                disabled={isSearching || !walletInput.trim()}
                size="sm"
                className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSearching ? (
                  <Activity className="w-3 h-3 animate-spin" />
                ) : (
                  <Search className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500/30 bg-red-900/20">
          <AlertDescription className="text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Data staleness warning */}
      {isDataStale && (
        <Alert className="mb-6 border-yellow-500/30 bg-yellow-900/20">
          <Activity className="w-4 h-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300 ml-2">
            <div>
              <p className="font-medium">Data may not be up-to-date</p>
              <p className="text-xs mt-1 text-yellow-400">
                Last received: {new Date(lastUpdate?.getTime() || 0).toLocaleTimeString('en-US', {hour12: false})} (indexer may not be running)
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};