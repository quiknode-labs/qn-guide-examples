import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useTokenContext } from "../context/TokenContext";
import type { Token } from "../types";
import { formatUnits } from "viem";

interface TokenSelectorProps {
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  otherToken: Token | null;
}

export default function TokenSelector({
  selectedToken,
  onSelectToken,
  otherToken,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { tokens, isLoading, tokenBalances } = useTokenContext();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter out the other selected token and apply search
  const filteredTokens = tokens.filter(
    (token) =>
      token.address !== otherToken?.address &&
      (token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get the balance for the selected token
  const selectedTokenBalance =
    selectedToken && tokenBalances[selectedToken.address]
      ? formatUnits(
          BigInt(tokenBalances[selectedToken.address]),
          selectedToken.decimals
        )
      : "0";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
      >
        {selectedToken ? (
          <div className="flex items-center">
            {selectedToken.icon ? (
              <img
                src={selectedToken.icon}
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                {selectedToken.symbol.charAt(0)}
              </div>
            )}
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span className="text-gray-500">Select token</span>
        )}
        <ChevronDown size={18} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-auto">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search tokens"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading tokens...
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No tokens found</div>
          ) : (
            <div className="py-1">
              {filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelectToken(token);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  {token.icon ? (
                    <img
                      src={token.icon}
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                      {token.symbol.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-xs text-gray-500">{token.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
