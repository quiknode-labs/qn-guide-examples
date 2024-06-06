import React, { useState, useEffect } from "react";

import Header from "./components/Header";
import PortfolioInput from "./components/PortfolioInput";
import PortfolioSummary from "./components/PortfolioSummary";
import HistoricalChart from "./components/HistoricalChart";
import PortfolioPieChart from "./components/PortfolioPieChart";
import PortfolioControls from "./components/PortfolioControls";
import { fetchAssets } from "./services/cryptoAPI";
import { Asset, PortfolioHolding, HistoricalDataEntry } from "./interfaces";
import {
  addHolding,
  updateHolding,
  removeHolding,
  fetchPortfolioData,
  fetchTotalPortfolioValue,
  handleExportCSV,
} from "./utils/portfolioUtils";

import CircularProgress from "@mui/material/CircularProgress";

const App: React.FC = () => {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [historicalData, setHistoricalData] = useState<HistoricalDataEntry[]>(
    []
  );
  const [currency, setCurrency] = useState("USD");
  const [timeInterval, setTimeInterval] = useState("1DAY");
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>(
    {}
  );
  const [assets, setAssets] = useState<{
    currencies: Asset[];
    cryptos: Asset[];
  }>({ currencies: [], cryptos: [] });
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load holdings from local storage
    const storedHoldings = localStorage.getItem("holdings");
    if (storedHoldings) {
      setHoldings(JSON.parse(storedHoldings));
    }

    // Fetch available assets
    const fetchAndSetAssets = async () => {
      const { currencies, cryptos } = await fetchAssets();
      setAssets({ currencies, cryptos });
    };

    fetchAndSetAssets();

    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      // Save holdings to local storage
      localStorage.setItem("holdings", JSON.stringify(holdings));
      if (holdings.length > 0) {
        // Automatically fetch total portfolio value
        const fetchTotalValue = async () => {
          await fetchTotalPortfolioValue(
            holdings,
            currency,
            setExchangeRates,
            setTotalValue,
            setLoading
          );
        };
        fetchTotalValue();
      } else {
        setTotalValue(0);
        setExchangeRates({});
        setLoading(false);
      }
    }
  }, [holdings, currency, initialized]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-4">
        <PortfolioInput
          onAddHolding={(asset, amount) =>
            setHoldings(addHolding(holdings, asset, amount))
          }
          assets={assets.cryptos}
          holdings={holdings}
          onUpdateHolding={(index, amount) =>
            setHoldings(updateHolding(holdings, index, amount))
          }
          onRemoveHolding={(index) =>
            setHoldings(removeHolding(holdings, index))
          }
        />
        <PortfolioControls
          currency={currency}
          setCurrency={setCurrency}
          timeInterval={timeInterval}
          setTimeInterval={setTimeInterval}
          calculatePortfolioValue={() =>
            fetchPortfolioData(
              holdings,
              currency,
              timeInterval,
              100,
              setHistoricalData,
              setLoading
            )
          }
          exportCSV={() => handleExportCSV(historicalData)}
          currencies={assets.currencies}
          disableExport={historicalData.length === 0}
        />

        {loading && (
          <div className="p-4">
            <CircularProgress />{" "}
          </div>
        )}

        {!loading && totalValue !== 0 && (
          <div>
            <div className="flex space-x-4">
              <div className="w-1/2 my-4 p-4 border rounded-lg shadow-sm bg-white h-96 text-center">
                <PortfolioSummary totalValue={totalValue} currency={currency} />
              </div>
              <div className="w-1/2 my-4 p-4 border rounded-lg shadow-sm bg-white h-96">
                <PortfolioPieChart
                  holdings={holdings}
                  exchangeRates={exchangeRates}
                  currency={currency}
                />
              </div>
            </div>
            <HistoricalChart data={historicalData} currency={currency} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
