import React, { useState, useEffect, useCallback } from 'react';
import { ClearinghouseState, AssetPosition, UserRateLimit, UserVaultEquity, SpotBalance, Delegation } from './shared/types';
import { Wallet, Activity, BarChart3, Search, Check, X } from 'lucide-react';
import { switchIndexerWallet, formatAddress } from './shared/utils';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent } from './components/ui/card';
import { TooltipProvider } from './components/ui/tooltip';
import { Alert, AlertDescription } from './components/ui/alert';

import { supabase } from './shared/supabase';
import { COLORS } from './shared/constants';

// Dashboard components
import { WalletHeader } from './components/dashboard/WalletHeader';
import { PortfolioMetrics } from './components/dashboard/PortfolioMetrics';
import { SpotHoldingsGrid } from './components/dashboard/SpotHoldingsGrid';
import { VaultEquitiesTable } from './components/dashboard/VaultEquitiesTable';
import { ActivePositionsTable } from './components/dashboard/ActivePositionsTable';

const Dashboard: React.FC = () => {
  const [currentWallet, setCurrentWallet] = useState<string>('');
  const [walletInput, setWalletInput] = useState<string>('');
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [latestState, setLatestState] = useState<ClearinghouseState | null>(null);
  const [positions, setPositions] = useState<AssetPosition[]>([]);
  const [userRateLimit, setUserRateLimit] = useState<UserRateLimit | null>(null);
  const [vaultEquities, setVaultEquities] = useState<UserVaultEquity[]>([]);
  const [spotBalances, setSpotBalances] = useState<SpotBalance[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);


  const isDataStale = latestState && (Date.now() - latestState.timestamp > 3000);




  const isValidWalletAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const fetchData = useCallback(async (walletAddress: string = currentWallet): Promise<boolean> => {
    try {
      setError(null);


      // Get latest clearinghouse state
      const { data: latestData, error: latestError } = await supabase
        .from('clearinghouse_states')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError && latestError.code !== 'PGRST116') throw latestError;

      // Get latest user rate limit data
      const { data: rateLimitData, error: rateLimitError } = await supabase
        .from('user_rate_limits')
        .select('*')
        .eq('user_address', walletAddress)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rateLimitError && rateLimitError.code !== 'PGRST116') throw rateLimitError;


      // Get vault equities data
      const { data: vaultData, error: vaultEquitiesError } = await supabase
        .from('user_vault_equities')
        .select('*')
        .eq('user_address', walletAddress)
        .order('timestamp', { ascending: false });

      if (vaultEquitiesError && vaultEquitiesError.code !== 'PGRST116') throw vaultEquitiesError;

      // Get positions directly by wallet address (like other stable data types)
      const { data: positionsData, error: positionsError } = await supabase
        .from('asset_positions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('timestamp', { ascending: false });

      if (positionsError && positionsError.code !== 'PGRST116') throw positionsError;

      // Get latest spot balances data
      const { data: spotBalancesData, error: spotBalancesError } = await supabase
        .from('spot_balances')
        .select('*')
        .eq('user_address', walletAddress)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (spotBalancesError && spotBalancesError.code !== 'PGRST116') throw spotBalancesError;

      // Get delegations data
      const { data: delegationsData, error: delegationsError } = await supabase
        .from('delegations')
        .select('*')
        .eq('user_address', walletAddress)
        .order('timestamp', { ascending: false });

      if (delegationsError && delegationsError.code !== 'PGRST116') throw delegationsError;

      // Check if we got actual data from the indexer (trading data OR vault data OR spot balances)
      const hasRealData = latestData !== null || rateLimitData !== null || (vaultData && vaultData.length > 0) || (spotBalancesData && spotBalancesData.length > 0);


      // Update all data directly since database now guarantees uniqueness
      if (latestData) {
        setLatestState(latestData);
      }

      if (rateLimitData) {
        setUserRateLimit(rateLimitData);
      }

      if (positionsData) {
        setPositions(positionsData);
      }

      if (vaultData !== null) {
        setVaultEquities(vaultData);
      }

      if (spotBalancesData !== null) {
        setSpotBalances(spotBalancesData);
      }

      if (delegationsData !== null) {
        setDelegations(delegationsData);
      }

      // Always update timestamp for freshness indicator
      setLastUpdate(new Date());

      return hasRealData || false;

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setIsLoading(false);
      // Don't set isSearching to false here, let the polling control it
    }
  }, []);

  const handleWalletSearch = async () => {
    if (!walletInput.trim()) return;

    const address = walletInput.trim();
    if (!isValidWalletAddress(address)) {
      setError('Invalid wallet address format');
      return;
    }

    // Clear ALL old data immediately when switching wallets for clean separation
    setLatestState(null);
    setPositions([]);
    setUserRateLimit(null);
    setVaultEquities([]);
    setSpotBalances([]);
    setDelegations([]);
    setError(null);
    setLastUpdate(null);



    // Set loading states for wallet switch
    setIsSearching(true);
    setCurrentWallet(address);
    setHasStarted(true);
    setHasInitialData(false); // Reset initial data flag for new search

    // Save wallet to localStorage for persistence across refreshes
    localStorage.setItem('currentWallet', address);

    try {
      // Signal the indexer to switch to the new wallet
      await switchIndexerWallet(address);

      // Wait longer for indexer to collect real data for new wallet
      // Poll every 3 seconds for up to 30 seconds to get actual data
      let attempts = 0;
      const maxAttempts = 10; // 30 seconds total

      const pollForData = async () => {
        attempts++;
        const hasAnyData = await fetchData(address);

        // If no real data yet and haven't exceeded max attempts, try again
        if (!hasAnyData && attempts < maxAttempts) {
          setTimeout(pollForData, 3000);
        } else {
          // Found data or reached max attempts, show dashboard
          setHasInitialData(true);
          setIsSearching(false);
        }
      };

      // Start polling after initial delay
      setTimeout(pollForData, 3000);

    } catch (error) {
      setError('Failed to switch wallet. Please try again.');
      setIsSearching(false);
      setHasInitialData(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleWalletSearch();
    }
  };

  const handleGoHome = () => {
    setHasStarted(false);
    setCurrentWallet('');
    setWalletInput('');
    setLatestState(null);
    setPositions([]);
    setUserRateLimit(null);
    setVaultEquities([]);
    setSpotBalances([]);
    setDelegations([]);
    setError(null);
    setHasInitialData(false);
    setIsSearching(false);
    setLastUpdate(null);


    localStorage.removeItem('currentWallet');
  };

  useEffect(() => {
    const savedWallet = localStorage.getItem('currentWallet');
    if (savedWallet && isValidWalletAddress(savedWallet)) {
      setCurrentWallet(savedWallet);
      setWalletInput(savedWallet);
      setHasStarted(true);
      // Start fetching data immediately for saved wallet
      fetchData(savedWallet).then(() => {
        setHasInitialData(true);
      });
    }
  }, []);

  useEffect(() => {
    // Only start auto-refresh if we have a wallet, have started, and have initial data
    if (currentWallet && hasStarted && hasInitialData) {
      // Auto-refresh every 1000ms - fetch all data
      const interval = setInterval(async () => {
        await fetchData(currentWallet);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentWallet, hasStarted, hasInitialData, fetchData]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentWallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Silently handle copy errors
    }
  };




  if (!hasStarted) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>

          <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
            <div className="text-center max-w-4xl mx-auto">
              {/* Modern Hero Section */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2 mb-6">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-300">Powered by QuickNode</span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-6 leading-tight">
                  Hyperliquid
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                    Portfolio Tracker
                  </span>
                </h1>

              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 group">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">Live Position Tracking</h3>
                    <p className="text-slate-400 text-sm">Real-time monitoring of all your active positions with instant updates</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 group">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">Advanced Analytics</h3>
                    <p className="text-slate-400 text-sm">Comprehensive charts and metrics for deep portfolio analysis</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 group">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">Vault Management</h3>
                    <p className="text-slate-400 text-sm">Track vault equities and monitor locked/unlocked status</p>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Search Interface */}
              <div className="w-[535px] mx-auto">
                <Card className="bg-slate-900/40 border-slate-700/40 backdrop-blur-lg shadow-2xl">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-white mb-2">Track Your Portfolio</h3>
                      <p className="text-slate-400 text-sm">Enter your wallet address to view real-time trading data</p>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        <Input
                          type="text"
                          value={walletInput}
                          onChange={(e) => setWalletInput(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Enter Your Wallet Address"
                          className={`pl-9 h-10 text-sm bg-slate-800/60 border-slate-600 focus:ring-2 rounded-lg transition-all duration-300 ${
                            walletInput.length > 0
                              ? isValidWalletAddress(walletInput)
                                ? 'focus:border-emerald-500 focus:ring-emerald-500/20 border-emerald-500/50'
                                : 'focus:border-red-500 focus:ring-red-500/20 border-red-500/50'
                              : 'focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                        />
                        {walletInput && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {isValidWalletAddress(walletInput) ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <X className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={handleWalletSearch}
                        disabled={isSearching || !walletInput.trim() || !isValidWalletAddress(walletInput)}
                        size="sm"
                        className="h-10 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isSearching ? (
                          <Activity className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setWalletInput('0x727956612a8700627451204a3ae26268bd1a1525');
                        }}
                        className="text-sm border-emerald-500/50 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400 rounded-lg transition-all duration-300"
                      >
                        Try Demo Wallet
                      </Button>
                    </div>

                    {error && (
                      <Alert className="mt-6 border-red-500/30 bg-red-900/20">
                        <AlertDescription className="text-red-300">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (isLoading || (hasStarted && !hasInitialData)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-2xl font-bold text-white mb-3">Loading Trading Data</h2>
          <p className="text-slate-400">Fetching data for {currentWallet ? formatAddress(currentWallet) : 'wallet'}...</p>
        </div>
      </div>
    );
  }

  if (isSearching && hasInitialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <Card className="max-w-md bg-slate-900/80 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-4">Switching Wallet</h2>
            <p className="text-slate-300 mb-4">
              Setting up monitoring and fetching trading data...
            </p>
            <div className="bg-slate-800/50 rounded-lg p-3 mb-6">
              <p className="text-sm text-emerald-300 font-mono">
                {formatAddress(currentWallet)}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Indexer processing wallet data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayState = latestState || {
    account_value: 0,
    withdrawable: 0,
    total_margin_used: 0,
    total_ntl_pos: 0,
    cross_total_margin_used: 0,
    cross_account_value: 0,
    total_raw_usd: 0,
    timestamp: Date.now()
  };

  // Calculate values after displayState is defined
  const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0);

  // Total Account (Perp) Value
  const totalAccountValue = displayState.account_value;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <WalletHeader
            currentWallet={currentWallet}
            walletInput={walletInput}
            setWalletInput={setWalletInput}
            copied={copied}
            copyToClipboard={copyToClipboard}
            isSearching={isSearching}
            isDataStale={isDataStale || false}
            lastUpdate={lastUpdate}
            error={error}
            handleWalletSearch={handleWalletSearch}
            handleKeyPress={handleKeyPress}
            handleGoHome={handleGoHome}
            isValidWalletAddress={isValidWalletAddress}
          />

          <PortfolioMetrics
            totalAccountValue={totalAccountValue}
            totalUnrealizedPnl={totalUnrealizedPnl}
            userRateLimit={userRateLimit}
            vaultEquities={vaultEquities}
            delegations={delegations}
            formatCurrency={formatCurrency}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SpotHoldingsGrid
              spotBalances={spotBalances}
              formatCurrency={formatCurrency}
              COLORS={COLORS}
            />

            <VaultEquitiesTable
              vaultEquities={vaultEquities}
              formatCurrency={formatCurrency}
            />
          </div>

          <ActivePositionsTable
            positions={positions}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;