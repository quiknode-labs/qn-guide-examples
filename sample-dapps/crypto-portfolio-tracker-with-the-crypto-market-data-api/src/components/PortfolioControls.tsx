import React from "react";

import { Asset } from "../interfaces";

interface PortfolioControlsProps {
  currency: string;
  setCurrency: (currency: string) => void;
  timeInterval: string;
  setTimeInterval: (interval: string) => void;
  calculatePortfolioValue: () => void;
  exportCSV: () => void;
  currencies: Asset[];
  disableExport: boolean;
}
const PortfolioControls: React.FC<PortfolioControlsProps> = ({
  currency,
  setCurrency,
  timeInterval,
  setTimeInterval,
  calculatePortfolioValue,
  exportCSV,
  currencies,
  disableExport,
}) => (
  <div className="flex space-x-4 mt-4">
    <button
      onClick={calculatePortfolioValue}
      className="bg-green-600 text-white py-2 px-4 rounded-md"
    >
      Get Historical Chart
    </button>
    <button
      onClick={exportCSV}
      className={`bg-blue-600 text-white py-2 px-4 rounded-md ${
        disableExport ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={disableExport}
    >
      Export as CSV
    </button>
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="p-2 border rounded-md"
    >
      {currencies.map((curr) => (
        <option key={curr.asset_id} value={curr.asset_id}>
          {curr.name} - {curr.asset_id}
        </option>
      ))}
    </select>
    <select
      value={timeInterval}
      onChange={(e) => setTimeInterval(e.target.value)}
      className="p-2 border rounded-md"
    >
      <option value="5MIN">5 Minutes</option>
      <option value="1HRS">1 Hour</option>
      <option value="4HRS">4 Hour</option>
      <option value="1DAY">1 Day</option>
      <option value="7DAY">1 Week</option>
    </select>
  </div>
);

export default PortfolioControls;
