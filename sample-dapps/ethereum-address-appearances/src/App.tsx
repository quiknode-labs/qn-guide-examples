import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AddressInputForm from "./components/AddressInputForm";
import ComparisonTable from "./components/ComparisonTable";
import TransactionSummary from "./components/TransactionSummary";
import AddressAppearancesResults from "./components/AddressAppearancesResults"; // New component for Address Appearances results

import compareData from "./helpers/compareData";
import fetchTransactions from "./helpers/fetchData";
import {
  Appearance,
  SimplifiedEtherscanTransaction,
  CombinedTransactionData,
} from "./interfaces";

const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || undefined;

const App: React.FC = () => {
  const [address, setAddress] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [customData, setCustomData] = useState<Appearance[]>([]);
  const [etherscanData, setEtherscanData] = useState<{
    [key: string]: SimplifiedEtherscanTransaction[];
  }>({});
  const [comparisonTable, setComparisonTable] = useState<
    CombinedTransactionData[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [customTotal, setCustomTotal] = useState<number>(0);
  const [etherscanTotals, setEtherscanTotals] = useState<{
    [key: string]: number;
  }>({});

  const handleFormSubmit = async (address: string) => {
    try {
      setLoading(true);
      setCustomData([]);
      setEtherscanData({});
      setErrorMsg("");

      const { customMethodData, esData, customTotal, etherscanTotals } =
        await fetchTransactions(address);

      setCustomData(customMethodData);
      setEtherscanData(esData);
      setCustomTotal(customTotal);
      setEtherscanTotals(etherscanTotals);
    } catch (error) {
      console.error("Error getting data:", error);
      setErrorMsg("Error getting data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customData.length > 0) {
      if (ETHERSCAN_API_KEY && Object.keys(etherscanData).length > 0) {
        const comparisonResult = compareData(customData, etherscanData);
        setComparisonTable(comparisonResult);
      } else {
        setComparisonTable([]);
      }
    }
  }, [customData, etherscanData]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <AddressInputForm
        onSubmit={handleFormSubmit}
        setAddress={setAddress}
        isLoading={loading}
      />
      {errorMsg && (
        <div className="mt-4 mx-auto text-red-600 bg-red-100 border border-red-400 rounded p-2 w-1/2 max-w-sm text-center justify-center">
          {errorMsg}
        </div>
      )}

      {ETHERSCAN_API_KEY && comparisonTable.length > 0 && customTotal > 0 && (
        <div>
          <ComparisonTable data={comparisonTable} />
          <TransactionSummary
            address={address}
            customTotal={customTotal}
            etherscanTotals={etherscanTotals}
          />
        </div>
      )}
      {!ETHERSCAN_API_KEY && customData.length > 0 && (
        <AddressAppearancesResults data={customData} />
      )}
      <Footer />
    </div>
  );
};

export default App;
