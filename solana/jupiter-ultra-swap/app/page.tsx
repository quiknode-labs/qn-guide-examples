"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SwapCard } from "@/components/SwapCard";
import { WalletButton } from "@/components/WalletButton";
import { TokenInput } from "@/components/TokenInput";
import { SwapButton } from "@/components/SwapButton";
import { StatusMessage } from "@/components/StatusMessage";
import { useTokenList } from "@/hooks/useTokenList";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useSwap } from "@/hooks/useSwap";
import { useQuote } from "@/hooks/useQuote";
import type { Token } from "@/lib/types";

const DEFAULT_FROM_TOKEN: Token = {
  address: "So11111111111111111111111111111111111111112",
  symbol: "SOL",
  name: "Solana",
  decimals: 9,
};

const DEFAULT_TO_TOKEN: Token = {
  address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
};

export default function Home() {
  // Wallet connection
  const { publicKey } = useWallet();
  
  // Token list and balances
  const { tokens } = useTokenList();
  const { balances, getBalance, refreshBalances, loading: balancesLoading } = useTokenBalances();
  
  // Swap execution hook
  const {
    executeSwap,
    status,
    error,
    txSignature,
    estimatedOutput,
    reset,
  } = useSwap();

  // Form state
  const [fromToken, setFromToken] = useState<Token | null>(DEFAULT_FROM_TOKEN);
  const [toToken, setToToken] = useState<Token | null>(DEFAULT_TO_TOKEN);
  const [amount, setAmount] = useState("");

  // Quote hook - automatically fetches quote when amount/tokens change
  const quoteInfo = useQuote(fromToken, toToken, amount);

  // Handle token selection - clear amount when token changes
  const handleFromTokenSelect = (token: Token) => {
    setFromToken(token);
    setAmount("");
  };

  // Filter tokens to only show those with balance > 0, sorted by balance
  const fromTokens = useMemo(() => {
    if (!publicKey || balancesLoading) {
      return [];
    }

    // Create a map of token addresses to their balances (in readable format)
    const balanceMap = new Map<string, number>();
    balances.forEach((b) => {
      const readableBalance = b.balance / Math.pow(10, b.decimals);
      balanceMap.set(b.mint, readableBalance);
    });

    // Filter tokens that have balance > 0
    const tokensWithBalance = tokens
      .filter((token) => {
        const balance = balanceMap.get(token.address) || 0;
        return balance > 0;
      })
      .map((token) => ({
        token,
        balance: balanceMap.get(token.address) || 0,
      }))
      .sort((a, b) => b.balance - a.balance) // Sort by balance (highest first)
      .map((item) => item.token);

    return tokensWithBalance;
  }, [tokens, balances, publicKey, balancesLoading]);

  // Refresh balances after successful swap
  useEffect(() => {
    if (status === "success") {
      setTimeout(() => refreshBalances(), 2000);
    }
  }, [status, refreshBalances]);

  // Set default "from" token when balances load
  useEffect(() => {
    if (!publicKey) {
      setFromToken(null);
      return;
    }

    if (balancesLoading) {
      return;
    }

    if (fromTokens.length === 0) {
      setFromToken(null);
      return;
    }

    // Set to first available token if current token has no balance
    setFromToken((currentToken) => {
      if (currentToken) {
        const balance = getBalance(currentToken.address);
        if (balance > 0) {
          return currentToken; // Keep current token if it has balance
        }
      }
      return fromTokens[0]; // Otherwise use first token with balance
    });
  }, [publicKey, balancesLoading, fromTokens, getBalance]);

  // Calculate balances and validation states
  const fromBalance = fromToken ? getBalance(fromToken.address) : 0;
  const toBalance = toToken ? getBalance(toToken.address) : 0;
  const amountNum = parseFloat(amount) || 0;
  
  // Validation flags
  const hasInsufficientBalance = amountNum > fromBalance;
  const hasAmount = amountNum > 0;
  const tokensAreDifferent =
    fromToken && toToken && fromToken.address !== toToken.address;
  
  // Can swap if all conditions are met
  const canSwap =
    publicKey &&
    fromToken &&
    toToken &&
    tokensAreDifferent &&
    hasAmount &&
    !hasInsufficientBalance &&
    status === "idle";

  const handleSwap = async () => {
    if (!canSwap || !fromToken || !toToken) return;
    try {
      await executeSwap(fromToken, toToken, amountNum);
    } catch (err) {
      console.error("Swap error:", err);
    }
  };

  const handleReset = () => {
    reset();
    setAmount("");
  };

  return (
    <SwapCard>
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center px-2 py-1 text-xs font-mono uppercase relative text-gray-900 mb-4" style={{ backgroundColor: 'oklch(89% .220298 144.5)' }}>
            // Jupiter Ultra
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Swap with Jupiter Ultra
          </h1>
          <p className="text-sm text-gray-500">Powered by QuickNode</p>
        </div>
        
        {/* Warning about mainnet-beta and real funds */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-semibold">Warning:</span>
          </div>
          <div className="mt-1 text-sm text-yellow-800">
            This sample app uses Solana mainnet-beta with real funds. Please use at your own risk.
          </div>
        </div>

        <div className="flex justify-end">
          <WalletButton />
        </div>
        <TokenInput
          label="From"
          token={fromToken}
          amount={amount}
          balance={fromBalance}
          tokens={fromTokens}
          onTokenSelect={handleFromTokenSelect}
          onAmountChange={setAmount}
          disabled={status !== "idle" || !publicKey}
        />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (status === "idle") {
                setFromToken(toToken);
                setToToken(fromToken);
                setAmount("");
              }
            }}
            disabled={status !== "idle"}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        <TokenInput
          label="To"
          token={toToken}
          amount={
            status === "idle"
              ? quoteInfo.outAmount || ""
              : estimatedOutput || ""
          }
          balance={toBalance}
          tokens={tokens}
          onTokenSelect={setToToken}
          onAmountChange={() => {}} // Read-only
          disabled={status !== "idle" || !publicKey}
          readOnly
        />

        {/* Quote Details Box - Shows when user has entered an amount */}
        {status === "idle" && hasAmount && fromToken && toToken && publicKey && (
          <div className="p-5 bg-gray-50/80 border border-gray-200 rounded-xl space-y-3 backdrop-blur-sm">
            {/* Error: Same token selected */}
            {fromToken.address === toToken.address ? (
              <div className="text-sm text-red-600">
                Please select different tokens to swap
              </div>
            ) : quoteInfo.loading ? (
              /* Loading state */
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Fetching best route...</span>
              </div>
            ) : quoteInfo.error ? (
              /* Error state */
              <div className="text-sm text-red-600">{quoteInfo.error}</div>
            ) : quoteInfo.outAmount ? (
              /* Success: Show quote details */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Exchange Rate</span>
                  <span className="text-gray-900 font-semibold">
                    1 {fromToken.symbol} = {quoteInfo.exchangeRate} {toToken.symbol}
                  </span>
                </div>

                <div className="border-t border-gray-200"></div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price Impact</span>
                  <span
                    className={`font-medium ${
                      parseFloat(quoteInfo.priceImpactPct) > 1
                        ? "text-red-600"
                        : parseFloat(quoteInfo.priceImpactPct) > 0.5
                          ? "text-yellow-600"
                          : "text-gray-900"
                    }`}
                  >
                    {parseFloat(quoteInfo.priceImpactPct).toFixed(4)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Slippage Tolerance</span>
                  <span className="text-gray-900 font-semibold">
                    {(quoteInfo.slippageBps / 100).toFixed(2)}%
                  </span>
                </div>

                {quoteInfo.routeLabels.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Route</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {quoteInfo.routeLabels.join(" → ")}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        <StatusMessage
          status={status}
          error={error}
          txSignature={txSignature}
          estimatedOutput={estimatedOutput}
        />

        <SwapButton
          status={status}
          onClick={handleSwap}
          disabled={!canSwap || quoteInfo.loading}
          walletConnected={!!publicKey}
          hasAmount={hasAmount}
          hasInsufficientBalance={hasInsufficientBalance}
        />

        {(status === "success" || status === "error") && (
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Reset
          </button>
        )}
      </div>
    </SwapCard>
  );
}

