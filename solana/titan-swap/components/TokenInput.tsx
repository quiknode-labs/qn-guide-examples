"use client";

import { TokenSelector } from "./TokenSelector";
import { SOL_MINT } from "@/lib/tokens";
import type { Token } from "@/lib/types";

/**
 * Lamports to leave behind when MAX-ing native SOL, so the swap still has
 * funds for transaction + priority fees and any ATA rent. Without this, a
 * full-balance "max" swap passes the UI balance check but fails on-chain.
 */
const SOL_FEE_BUFFER = 0.01;

interface TokenInputProps {
  label: string;
  token: Token | null;
  amount: string;
  balance?: number;
  tokens: Token[];
  onTokenSelect: (token: Token) => void;
  onAmountChange: (amount: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function TokenInput({
  label,
  token,
  amount,
  balance,
  tokens,
  onTokenSelect,
  onAmountChange,
  disabled = false,
  readOnly = false,
}: TokenInputProps) {
  const isNativeSol = token?.address === SOL_MINT;
  // For native SOL, hold back a buffer for fees/rent; never go negative.
  const maxAmount =
    balance === undefined
      ? 0
      : isNativeSol
      ? Math.max(balance - SOL_FEE_BUFFER, 0)
      : balance;

  const handleMaxClick = () => {
    if (maxAmount > 0) onAmountChange(maxAmount.toString());
  };

  const canUseMax = !readOnly && maxAmount > 0 && !disabled;

  return (
    <div className="border border-border bg-bg-elev p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {balance !== undefined && token && (
          <button
            type="button"
            onClick={canUseMax ? handleMaxClick : undefined}
            disabled={!canUseMax}
            className={`font-mono text-[10px] tabular-nums ${
              canUseMax
                ? "text-fg-dim hover:text-accent cursor-pointer"
                : "text-fg-ghost cursor-default"
            }`}
          >
            BAL {balance.toFixed(4)}
            {canUseMax && <span className="ml-1 text-accent">MAX</span>}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || /^\d*\.?\d*$/.test(value)) onAmountChange(value);
          }}
          disabled={disabled || readOnly}
          readOnly={readOnly}
          className="flex-1 min-w-0 bg-transparent font-mono tabular-nums text-2xl text-fg focus:outline-none placeholder:text-fg-ghost disabled:cursor-not-allowed"
        />
        <TokenSelector
          tokens={tokens}
          selectedToken={token}
          onSelect={onTokenSelect}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
