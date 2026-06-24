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
    if (status === "building") return "Building transaction…";
    if (status === "signing") return "Approve in wallet";
    if (status === "sending") return "Submitting…";
    if (status === "confirming") return "Confirming…";
    return "Swap";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3.5 px-6 font-mono uppercase tracking-wide text-sm font-semibold transition-all ${
        disabled
          ? "bg-bg-elev text-fg-ghost border border-border cursor-not-allowed"
          : "bg-accent text-accent-fg hover:opacity-90"
      }`}
    >
      {getButtonText()}
    </button>
  );
}
