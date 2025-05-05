import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useWalletHistory } from "../hooks/useWalletHistory";
import { formatUnits } from "viem";
import { ExternalLink, ChevronDown, ChevronUp, Info } from "lucide-react";
import { BASE_EXPLORER_URL } from "../lib/constants";

interface MultiTokenValue {
  id: string;
  value: string;
}

interface Token {
  type: string;
  standard: string;
  name: string;
  contract: string;
  transfers: number;
  symbol?: string;
  decimals: number;
  balance?: string;
  multiTokenValues?: MultiTokenValue[];
  ids?: string[];
}

interface WalletData {
  page: number;
  totalPages: number;
  itemsOnPage: number;
  address: string;
  balance: string;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
  txs: number;
  nonTokenTxs: number;
  txids: string[];
  nonce: string;
  tokens: Token[];
}

interface WalletHistoryProps {
  walletData: WalletData;
  BASE_EXPLORER_URL: string;
}

export default function WalletHistory() {
  const { address } = useAccount();
  const { walletData, isLoading, error } = useWalletHistory(address);
  const [tokensExpanded, setTokensExpanded] = useState(false);
  const [txExpanded, setTxExpanded] = useState(false);

  if (!address) {
    return (
      <div className="p-4 text-center text-gray-500">
        Connect your wallet to view history
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading wallet data. Please try again.
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="p-4 text-center text-gray-500">
        No wallet data available
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
      {/* Native Balance Section */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium mb-3 text-gray-700">
          Native Balance
        </h3>
        <p className="text-xl font-semibold">
          {formatUnits(BigInt(walletData.balance || "0"), 18)} ETH
        </p>
        <div className="mt-3 text-sm text-gray-600 flex items-center">
          <span className="font-medium mr-2">Nonce:</span> {walletData.nonce}
        </div>
      </div>

      {/* Tokens Section */}
      {walletData.tokens && walletData.tokens.length > 0 && (
        <div className="mb-6">
          <div
            className="flex items-center justify-between bg-white p-4 rounded-t-lg border border-gray-200 cursor-pointer"
            onClick={() => setTokensExpanded(!tokensExpanded)}
          >
            <h3 className="text-sm font-medium text-gray-700">
              Tokens ({walletData.tokens.length})
            </h3>
            {tokensExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </div>

          {tokensExpanded && (
            <>
              <div className="bg-blue-50 border-l border-r border-blue-200 p-3 flex items-start">
                <Info
                  size={18}
                  className="text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-blue-700">
                  This list shows all tokens associated with this wallet based
                  on blockchain data, including potential airdrops and spam
                  tokens. Exercise caution when interacting with unfamiliar
                  tokens.
                </p>
              </div>
              <div className="bg-white rounded-b-lg border-l border-r border-b border-gray-200 overflow-x-auto">
                <table className="w-full table-fixed divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* Token name with hyperlink */}
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                        Token
                      </th>
                      {/* New column for Token Type */}
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Symbol
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {walletData.tokens.map((token, index) => {
                      // ERC1155 with multiTokenValues
                      if (token.type === "ERC1155" && token.multiTokenValues) {
                        return token.multiTokenValues.map(
                          (multiToken, subIndex) => (
                            <tr
                              key={`${token.contract}-${multiToken.id}-${subIndex}`}
                            >
                              <td className="px-3 py-2 text-sm break-words">
                                <a
                                  href={`https://basescan.org/address/${token.contract}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {token.name} ID {multiToken.id}
                                </a>
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {token.type}
                              </td>
                              <td className="px-3 py-2 text-sm break-words">
                                {token.symbol || "."}
                              </td>
                              <td className="px-3 py-2 text-sm text-right">
                                {token.multiTokenValues.length}
                              </td>
                            </tr>
                          )
                        );
                      }

                      // ERC721 or ERC1155 with ids
                      if (
                        (token.type === "ERC721" || token.type === "ERC1155") &&
                        token.ids &&
                        token.ids.length > 0
                      ) {
                        return (
                          <tr key={`${token.contract}-${index}`}>
                            <td className="px-3 py-2 text-sm break-words">
                              <a
                                href={`https://basescan.org/address/${token.contract}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {token.name} ID {token.ids[0]}{" "}
                                {token.ids.length > 1
                                  ? `(+${token.ids.length - 1} more)`
                                  : ""}
                              </a>
                            </td>
                            <td className="px-3 py-2 text-sm">{token.type}</td>
                            <td className="px-3 py-2 text-sm break-words">
                              {token.symbol || "."}
                            </td>
                            <td className="px-3 py-2 text-sm text-right">
                              {token.ids.length}
                            </td>
                          </tr>
                        );
                      }

                      // Regular ERC20 tokens.
                      return (
                        <tr key={`${token.contract}-${index}`}>
                          <td className="px-3 py-2 text-sm break-words">
                            <a
                              href={`https://basescan.org/address/${token.contract}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {token.name || "Unknown"}
                            </a>
                          </td>
                          <td className="px-3 py-2 text-sm">{token.type}</td>
                          <td className="px-3 py-2 text-sm break-words">
                            {token.symbol ||
                            (token.name &&
                              token.name.includes("[") &&
                              token.name.includes("]"))
                              ? token.name.match(/\[(.*?)\]/)?.[1] || "."
                              : "."}
                          </td>
                          <td className="px-3 py-2 text-sm text-right">
                            {token.balance
                              ? parseFloat(
                                  formatUnits(
                                    BigInt(token.balance),
                                    token.decimals
                                  )
                                ).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })
                              : "0"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Transactions Section */}
      {walletData.txids && walletData.txids.length > 0 && (
        <div className="mb-4">
          <div
            className="flex items-center justify-between bg-white p-4 rounded-t-lg border border-gray-200 cursor-pointer"
            onClick={() => setTxExpanded(!txExpanded)}
          >
            <h3 className="text-sm font-medium text-gray-700">
              Recent {walletData.txids.length} Transactions
            </h3>
            {txExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          <div
            className={`space-y-1 bg-white rounded-b-lg border-l border-r border-b border-gray-200 ${
              txExpanded ? "p-3" : "hidden"
            }`}
          >
            {walletData.txids.map((txid, index) => (
              <a
                key={txid}
                href={`${BASE_EXPLORER_URL}/tx/${txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <span className="text-sm font-mono">
                  {txid.substring(0, 10)}...{txid.substring(txid.length - 8)}
                </span>
                <ExternalLink size={16} className="text-gray-500" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
