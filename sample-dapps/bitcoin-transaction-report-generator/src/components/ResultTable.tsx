import React from "react";
import { ExtendedResult } from "../interfaces.ts";
import ExpandableCell from "./ExpandableCell";
import { exportAsCSV, copyAsCSV } from "../helpers/convertToCsv.ts";

interface ResultsTableProps {
  data: ExtendedResult;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto mt-6">
      <div className="my-4 flex space-x-4">
        <button
          onClick={() => exportAsCSV(data.extendedTransactions)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Export as CSV
        </button>
        <button
          onClick={() => copyAsCSV(data.extendedTransactions)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Copy as CSV
        </button>
      </div>
      <table className="min-w-full table-fixed text-xs">
        <thead className="bg-blue-100">
          <tr>
            <th className="p-2 text-center">Day</th>
            <th className="p-2 text-center">Time</th>
            <th className="p-2 text-center">Transaction ID</th>
            <th className="p-2 text-center">Type</th>
            <th className="p-2 text-center">Direction</th>
            <th className="p-2 text-center">From Addresses</th>
            <th className="p-2 text-center">To Addresses</th>
            <th className="p-2 text-center">Amount (BTC)</th>
            <th className="p-2 text-center">Amount (USD)</th>
            <th className="p-2 text-center">Fees (BTC)</th>
            <th className="p-2 text-center">Fees (USD)</th>
            <th className="p-2 text-center">Pre Balance (BTC)</th>
            <th className="p-2 text-center">Post Balance (BTC)</th>
          </tr>
        </thead>
        <tbody>
          {data.extendedTransactions.map((tx) => (
            <tr key={tx.txid} className="border-t">
              <td className="p-2 overflow-auto max-h-16 text-center">
                {tx.day}
              </td>
              <td className="p-2 overflow-auto max-h-16 text-center">
                {new Date(tx.timestamp).toLocaleTimeString("en-US", {
                  timeZone: tx.userTimezone,
                  timeZoneName: "short",
                })}
              </td>
              <td className="p-2 overflow-auto max-h-16 text-center">
                <ExpandableCell content={tx.txid} />
              </td>
              <td className="p-2 overflow-auto max-h-16 text-center">
                {tx.type}
              </td>
              <td className="p-2 overflow-auto max-h-16 text-center">
                {tx.direction}
              </td>
              <ExpandableCell content={tx.fromAddresses} />
              <ExpandableCell content={tx.toAddresses} />
              <td className="p-2 overflow-auto max-h-16 text-center">
                {tx.btcAmount.toFixed(8)}
              </td>
              <td className="p-2 overflow-auto max-h-16 text-center">
                {tx.usdAmount.toFixed(2)}
              </td>
              <td className="p-2 overflow-auto max-h-16 text-center">
                {tx.btcFees.toFixed(8)}
              </td>
              <td className="p-2 overflow-auto max-h-16 text-center">
                {tx.usdFees.toFixed(2)}
              </td>
              <td className="p-2 overflow-auto max-h-16 text-center">
                {tx.balanceBeforeTx.toFixed(8)}
              </td>
              <td className="p-2 overflow-auto max-h-16 text-center">
                {tx.balanceAfterTx.toFixed(8)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
