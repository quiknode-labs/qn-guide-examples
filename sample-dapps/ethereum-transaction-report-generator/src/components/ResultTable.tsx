import React from "react";
import { ExtendedResult } from "../interfaces.ts";
import CopyIcon from "./CopyIcon.tsx";
import { exportAsCSV, copyAsCSV } from "../helpers/convertToCsv.ts";

interface ResultsTableProps {
  data: ExtendedResult;
}

function shortenAddress(address: string) {
  if (address.length < 10) {
    return address;
  }
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => {
      console.log("Copied to clipboard!");
    },
    (err) => {
      console.error("Could not copy text: ", err);
    }
  );
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto mt-6">
      <div>
        <h3>Address: {data.address}</h3>
        <p>Current Balance: {parseFloat(data.balance) / 1e18} ETH</p>
        <p>Nonce: {data.nonce}</p>
        <p>Total Transactions: {data.txs}</p>
        <p>Non-Token Transactions: {data.nonTokenTxs}</p>
        <p>Internal Transactions: {data.internalTxs}</p>
      </div>
      <div className="my-4 flex space-x-4">
        <button
          onClick={() => exportAsCSV(data.extractedTransaction)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Export as CSV
        </button>
        <button
          onClick={() => copyAsCSV(data.extractedTransaction)}
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
            <th className="p-2 text-center">Block</th>
            <th className="p-2 text-center">Transaction ID</th>
            <th className="p-2 text-center">Transaction Status</th>
            <th className="p-2 text-center">Transaction Type</th>
            <th className="p-2 text-center">Asset</th>
            <th className="p-2 text-center">Sender Address</th>
            <th className="p-2 text-center">Direction</th>
            <th className="p-2 text-center">Receiver Address</th>
            <th className="p-2 text-center">Amount</th>
            <th className="p-2 text-center">Token ID</th>
            <th className="p-2 text-center">Fees</th>
            <th className="p-2 text-center">Method Name/ID</th>
          </tr>
        </thead>
        <tbody>
          {data.extractedTransaction.map((tx, index) => (
            <tr key={index} className="border-t">
              <td className="p-2 text-center">{tx.day}</td>

              <td className="p-2 text-center">
                {new Date(tx.timestamp).toLocaleTimeString("en-US", {
                  timeZone: tx.userTimezone,
                  timeZoneName: "short",
                })}
              </td>
              <td className="p-2 text-center">{tx.blockHeight}</td>

              <td
                className="p-2 flex items-top justify-center space-x-2 cursor-pointer"
                onClick={() => copyToClipboard(tx.txid)}
              >
                <a
                  href={`https://etherscan.io/tx/${tx.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {shortenAddress(tx.txid)}
                </a>
                <CopyIcon />
              </td>
              <td className="p-2 text-center">{tx.status}</td>
              <td className="p-2 text-center">{tx.txType}</td>
              <td className="p-2 text-center">
                {(tx.txType === "ERC20" ||
                  tx.txType === "ERC721" ||
                  tx.txType === "ERC1155") &&
                tx.contract ? (
                  <a
                    href={`https://etherscan.io/token/${tx.contract}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {tx.assetType}
                  </a>
                ) : (
                  tx.assetType
                )}
              </td>
              <td
                className="p-2 flex items-center justify-center space-x-2 cursor-pointer"
                onClick={() => copyToClipboard(tx.senderAddress)}
              >
                <span>{shortenAddress(tx.senderAddress)}</span>
                <CopyIcon />
              </td>
              <td className="p-2 text-center">{tx.direction}</td>

              <td
                className="p-2 flex items-center justify-center space-x-2 cursor-pointer"
                onClick={() => copyToClipboard(tx.receiverAddress)}
              >
                <span>{shortenAddress(tx.receiverAddress)}</span>
                <CopyIcon />
              </td>
              <td
                className="p-2 text-center"
                style={{ wordBreak: "break-word" }}
              >
                {tx.value}
              </td>
              <td
                className="p-2 text-center"
                style={{ wordBreak: "break-word" }}
              >
                {tx.tokenId ? tx.tokenId : "N/A"}
              </td>
              <td
                className="p-2 text-center"
                style={{ wordBreak: "break-word" }}
              >
                {tx.fee + " ETH"}
              </td>
              <td className="p-2 text-center">{tx.methodNameOrId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
