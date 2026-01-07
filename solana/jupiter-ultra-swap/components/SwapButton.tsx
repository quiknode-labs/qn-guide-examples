"use client";

import type { SwapStatus } from "@/lib/types";

interface SwapButtonProps {
  status: SwapStatus;
  onClick: () => void;
  disabled: boolean;
  walletConnected: boolean;
  hasAmount: boolean;
  hasInsufficientBalance: boolean;
}

export function SwapButton({
  status,
  onClick,
  disabled,
  walletConnected,
  hasAmount,
  hasInsufficientBalance,
}: SwapButtonProps) {
  const getButtonText = () => {
    if (!walletConnected) return "Connect Wallet";
    if (!hasAmount) return "Enter amount";
    if (hasInsufficientBalance) return "Insufficient balance";
    if (status === "quoting" || status === "signing" || status === "executing") {
      if (status === "quoting") return "Fetching quote...";
      if (status === "signing") return "Please approve in your wallet";
      if (status === "executing") return "Swapping...";
    }
    return "Swap";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 px-6 rounded-full font-semibold text-lg transition-all ${
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gray-900 hover:bg-gray-800 text-white"
      }`}
    >
      {getButtonText()}
    </button>
  );
}

