// src/components/PortfolioSummary.tsx
import React from "react";
import { PortfolioSummaryProps } from "../interfaces";

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  totalValue,
  currency,
}) => {
  return (
    <div className="my-4 p-4 border rounded-lg shadow-sm bg-white text-center">
      <h2 className="text-xl font-semibold">Total Portfolio Value</h2>
      <p className="text-2xl">
        {totalValue.toFixed(2)} {currency}
      </p>
    </div>
  );
};

export default PortfolioSummary;
