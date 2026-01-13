"use client";

import { TokenSelector } from "./TokenSelector";
import type { Token } from "@/lib/types";

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
  const handleMaxClick = () => {
    if (balance !== undefined && balance > 0) {
      onAmountChange(balance.toString());
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {balance !== undefined && token && (
          <div className="text-sm text-gray-500">
            Balance:{" "}
            <button
              type="button"
              onClick={!readOnly && balance > 0 && !disabled ? handleMaxClick : undefined}
              disabled={readOnly || balance <= 0 || disabled}
              className={`${
                !readOnly && balance > 0 && !disabled
                  ? "text-gray-900 hover:text-gray-700 cursor-pointer underline"
                  : "text-gray-500 cursor-default"
              }`}
            >
              {balance.toFixed(6)}
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              // Allow numbers and decimal point
              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                onAmountChange(value);
              }
            }}
            disabled={disabled || readOnly}
            readOnly={readOnly}
            className="w-full px-4 py-3 pr-10 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {!readOnly && amount && amount.length > 0 && (
            <button
              type="button"
              onClick={() => onAmountChange("")}
              disabled={disabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear amount"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
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

