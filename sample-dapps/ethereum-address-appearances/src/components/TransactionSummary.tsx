import React from "react";

interface TransactionSummaryProps {
  address: string;
  customTotal: number;
  etherscanTotals: { [key: string]: number };
}

const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  address,
  customTotal,
  etherscanTotals,
}) => {
  return (
    <div className="bg-white p-4 rounded shadow-md mt-4">
      <h1 className="text-center text-lg font-semibold mt-4">
        Results for{" "}
        <a
          href={`https://etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          {address}
        </a>
      </h1>
      <h3 className="text-xl font-semibold mb-2">Transaction Totals</h3>
      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr>
            <th className="bg-gray-100 border border-gray-200 p-2 text-left">
              TrueBlocks Data
            </th>
            <th className="bg-gray-100 border border-gray-200 p-2 text-left">
              Etherscan Data
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-200 p-2 align-top">
              Total Transaction: {customTotal}
            </td>
            <td className="border border-gray-200 p-2 align-top">
              Total Transaction: {etherscanTotals.overall}
              <ul>
                <li>- Normal: {etherscanTotals.txlist}</li>
                <li>- Internal: {etherscanTotals.txlistinternal}</li>
                <li>- ERC20: {etherscanTotals.tokentx}</li>
                <li>- ERC721: {etherscanTotals.tokennfttx}</li>
                <li>- ERC1155: {etherscanTotals.token1155tx}</li>
              </ul>
            </td>
          </tr>
          <tr></tr>
        </tbody>
      </table>
    </div>
  );
};

export default TransactionSummary;
