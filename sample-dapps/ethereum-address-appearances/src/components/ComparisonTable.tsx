import React from 'react';
import { CombinedTransactionData } from "../interfaces";


interface ComparisonTableProps {
  data: CombinedTransactionData[];
}

const txTypeMap: { [key: string]: string } = {
  txlist: "Normal Tx",
  txlistinternal: "Internal Tx",
  tokentx: "ERC20 Transfer",
  tokennfttx: "ERC721 Transfer",
  token1155tx: "ERC1155 Transfer",
};

const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  return (
    <div className="bg-white p-4 rounded shadow-md mt-4 mb-4">
      <table className="min-w-full border-collapse border border-gray-200">
        <thead className="sticky top-0 bg-white">
          <tr>
            <th
              colSpan={2}
              className="bg-gray-100 border border-gray-200 p-2 text-left"
            >
              TrueBlocks Data
            </th>
            <th
              colSpan={3}
              className="bg-gray-100 border border-gray-200 p-2 text-left"
            >
              Etherscan Data
            </th>
          </tr>
          <tr>
            <th className="bg-gray-100 border border-gray-200 p-2 text-left">
              Block Number
            </th>
            <th className="bg-gray-100 border border-gray-200 p-2 text-left">
              Tx Index
            </th>
            <th className="bg-gray-100 border border-gray-200 p-2 text-left">
              Block Number
            </th>
            <th className="bg-gray-100 border border-gray-200 p-2 text-left">
              Tx Index
            </th>
            <th className="bg-gray-100 border border-gray-200 p-2 text-left">
              Type
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="border border-gray-200 p-2">
                <a
                  href={`https://etherscan.io/block/${row.customBlockNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {row.customBlockNumber}
                </a>
              </td>
              <td className="border border-gray-200 p-2">
                {row.customTxIndex}
              </td>
              <td className="border border-gray-200 p-2">
                <a
                  href={`https://etherscan.io/block/${row.etherscanBlockNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {row.etherscanBlockNumber}
                </a>
              </td>
              <td className="border border-gray-200 p-2">
                {row.etherscanTxIndex}
              </td>
              <td className="border border-gray-200 p-2">
                {txTypeMap[row.type] || row.type}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
