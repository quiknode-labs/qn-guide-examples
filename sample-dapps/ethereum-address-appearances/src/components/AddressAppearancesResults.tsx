// src/components/AddressAppearancesResults.tsx
import React from "react";
import { Appearance } from "../interfaces";

interface AddressAppearancesResultsProps {
  data: Appearance[];
}

const AddressAppearancesResults: React.FC<AddressAppearancesResultsProps> = ({
  data,
}) => {
  return (
    <div className="mt-8 mx-auto p-4 w-full max-w-4xl">
      <h2 className="text-xl font-bold mb-4">Address Appearances Results</h2>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">Block Number</th>
            <th className="px-4 py-2">Transaction Index</th>
          </tr>
        </thead>
        <tbody>
          {data.map((appearance, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">
                {" "}
                <a
                  href={`https://etherscan.io/block/${appearance.blockNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {appearance.blockNumber}
                </a>
              </td>
              <td className="border px-4 py-2">
                {appearance.transactionIndex}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AddressAppearancesResults;
