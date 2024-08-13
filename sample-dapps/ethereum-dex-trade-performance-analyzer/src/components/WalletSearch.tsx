import React, { useState, useEffect } from "react";
import { viem } from "@quicknode/sdk";

interface WalletSearchProps {
  onSearch: (address: string) => void;
}

const WalletSearch: React.FC<WalletSearchProps> = ({ onSearch }) => {
  const [address, setAddress] = useState("");
  const [isValidAddress, setIsValidAddress] = useState(false);

  useEffect(() => {
    setIsValidAddress(viem.isAddress(address));
  }, [address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidAddress) {
      onSearch(address.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="wallet-address" className="sr-only">
            Wallet Address
          </label>
          <input
            id="wallet-address"
            name="address"
            type="text"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
            placeholder="Enter wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>
      {!isValidAddress && address && (
        <p className="text-red-500 text-sm">
          Please enter a valid EVM wallet address.
        </p>
      )}
      <div>
        <button
          type="submit"
          className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
            isValidAddress
              ? "bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              : "bg-gray-300 cursor-not-allowed"
          }`}
          disabled={!isValidAddress}
        >
          Analyze Wallet
        </button>
      </div>
    </form>
  );
};

export default WalletSearch;
