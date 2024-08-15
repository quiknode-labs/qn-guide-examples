import React from "react";
import { OverallStats } from "../interfaces/OverallStats";

interface OverallStatsDisplayProps {
  stats: OverallStats;
}

const OverallStatsDisplay: React.FC<OverallStatsDisplayProps> = ({ stats }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const colorClass = (value: number) =>
    value >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Wallet: {stats.wallet_address}
        </h3>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">PnL</dt>
              <dd className={`mt-1 text-sm ${colorClass(stats.pnl)} sm:mt-0`}>
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 2,
                }).format(stats.pnl)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Total Trades
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                {stats.total_trades}
              </dd>
            </div>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Win Rate</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                {(stats.win_rate * 100).toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Value</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 2,
                }).format(stats.total_value)}
              </dd>
            </div>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">First Trade</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                {formatDate(stats.first_trade_timestamp)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Trade</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                {formatDate(stats.last_trade_timestamp)}
              </dd>
            </div>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Realized Profit
              </dt>
              <dd
                className={`mt-1 text-sm ${colorClass(
                  stats.realized_profit
                )} sm:mt-0`}
              >
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 2,
                }).format(stats.realized_profit)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Realized Return
              </dt>
              <dd
                className={`mt-1 text-sm ${colorClass(
                  stats.realized_return
                )} sm:mt-0`}
              >
                {stats.realized_return.toFixed(2)}%
              </dd>
            </div>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Unrealized Profit
              </dt>
              <dd
                className={`mt-1 text-sm ${colorClass(
                  stats.unrealized_profit
                )} sm:mt-0`}
              >
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 2,
                }).format(stats.unrealized_profit)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Unrealized Return
              </dt>
              <dd
                className={`mt-1 text-sm ${colorClass(
                  stats.unrealized_return
                )} sm:mt-0`}
              >
                {stats.unrealized_return.toFixed(2)}%
              </dd>
            </div>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Total Buy Volume
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 2,
                }).format(stats.total_buy_volume)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Total Sell Volume
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 2,
                }).format(stats.total_sell_volume)}
              </dd>
            </div>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Total Buy Txs
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                {stats.total_buys}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Total Sell Txs
              </dt>
              <dd className={"mt-1 text-sm text-gray-900 sm:mt-0"}>
                {stats.total_sells}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default OverallStatsDisplay;
