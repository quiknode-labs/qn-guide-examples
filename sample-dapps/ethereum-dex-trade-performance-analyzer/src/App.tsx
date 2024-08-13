import React, { useState } from "react";
import { OverallStats } from "./interfaces/OverallStats";
import { TokenPerformance } from "./interfaces/TokenPerformance";
import {
  getWalletLatestTotalPerformance,
  getWalletLatestPerformancePerToken,
} from "./services/api";
import WalletSearch from "./components/WalletSearch";
import OverallStatsDisplay from "./components/OverallStatsDisplay";
import TokenPerformanceTable from "./components/TokenPerformanceTable";

const App: React.FC = () => {
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [tokenPerformance, setTokenPerformance] = useState<TokenPerformance[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState<boolean>(false);

  const handleSearch = async (address: string) => {
    setLoading(true);
    setError(null);
    setDataFetched(false);

    try {
      const [overallStatsData, tokenPerformanceData] = await Promise.all([
        getWalletLatestTotalPerformance(address),
        getWalletLatestPerformancePerToken(address),
      ]);

      setOverallStats(overallStatsData);
      setTokenPerformance(tokenPerformanceData.data || []);
      setDataFetched(true);
    } catch (err) {
      setError("Error fetching wallet data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-center text-primary-600 mb-8">
              DEX Trade Performance Analyzer
            </h1>
            <WalletSearch onSearch={handleSearch} />
            {loading && <p className="text-center mt-4">Loading...</p>}
            {error && <p className="text-center mt-4 text-red-500">{error}</p>}
            {dataFetched && overallStats && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-primary-600 mb-4">
                  Overall Performance
                </h2>
                <OverallStatsDisplay stats={overallStats} />
              </div>
            )}
            {dataFetched && tokenPerformance.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-primary-600 mb-4">
                  Token Performance
                </h2>
                <TokenPerformanceTable performance={tokenPerformance} />
              </div>
            )}
            {dataFetched && tokenPerformance.length === 0 && (
              <p className="text-center mt-4 text-gray-500">
                No token performance data available for this wallet.
              </p>
            )}
            {!loading && !error && !dataFetched && (
              <p className="text-center mt-4 text-gray-500">
                Enter a wallet address to see the analysis.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
