import React, { useState } from "react";
import { TokenPerformance } from "../interfaces/TokenPerformance";

interface TokenPerformanceTableProps {
  performance: TokenPerformance[];
}

const TokenPerformanceTable: React.FC<TokenPerformanceTableProps> = ({
  performance,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (tokenAddress: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(tokenAddress)) {
      newExpandedRows.delete(tokenAddress);
    } else {
      newExpandedRows.add(tokenAddress);
    }
    setExpandedRows(newExpandedRows);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getEtherscanUrl = (tokenAddress: string) => {
    return `https://etherscan.io/token/${tokenAddress}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Token
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              PNL
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Total Trades
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Total Buy
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Total Sell
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Avg Buy Price
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Current Price
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {performance.map((token) => (
            <React.Fragment key={token.token_address}>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <a
                      href={getEtherscanUrl(token.token_address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-600 hover:text-primary-900"
                    >
                      {token.token_symbol}
                    </a>
                    <div className="text-sm text-gray-500 ml-2">
                      ({token.token_name})
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm ${
                      token.pnl >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${token.pnl.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {token.total_trades}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {token.total_buy_amount.toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {token.total_sell_amount.toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${token.avg_buy_price.toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${token.current_price.toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleRow(token.token_address)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    {expandedRows.has(token.token_address) ? "Hide" : "Show"}{" "}
                    Details
                  </button>
                </td>
              </tr>
              {expandedRows.has(token.token_address) && (
                <tr>
                  <td colSpan={8} className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p>
                          <strong>First Trade:</strong>{" "}
                          {formatDate(token.first_trade_timestamp)}
                        </p>
                        <p>
                          <strong>Last Trade:</strong>{" "}
                          {formatDate(token.last_trade_timestamp)}
                        </p>
                        <p>
                          <strong>Total Buy Volume:</strong> $
                          {token.total_buy_volume.toFixed(2)}
                        </p>
                        <p>
                          <strong>Total Sell Volume:</strong> $
                          {token.total_sell_volume.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Realized Profit:</strong> $
                          {token.realized_profit.toFixed(2)}
                        </p>
                        <p>
                          <strong>Unrealized Profit:</strong> $
                          {token.unrealized_profit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TokenPerformanceTable;
