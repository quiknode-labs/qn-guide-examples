"use client";

import { useState, useEffect, useMemo } from "react";
import { useWalletAccount } from "@/app/providers/WalletProvider";
import { SwapCard } from "@/components/SwapCard";
import { WalletButton } from "@/components/WalletButton";
import { TokenInput } from "@/components/TokenInput";
import { SwapButton } from "@/components/SwapButton";
import { StatusMessage } from "@/components/StatusMessage";
import { ProviderRace } from "@/components/ProviderRace";
import { VenueSplit } from "@/components/VenueSplit";
import { SimulationToggle } from "@/components/SimulationToggle";
import { SlippageControl } from "@/components/SlippageControl";
import { useTokenList } from "@/hooks/useTokenList";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useSwap } from "@/hooks/useSwap";
import { useQuote } from "@/hooks/useQuote";
import { useTitanMeta } from "@/hooks/useTitanMeta";
import { COMMON_TOKENS } from "@/lib/tokens";
import type { Token } from "@/lib/types";

const DEFAULT_FROM_TOKEN = COMMON_TOKENS[0]; // SOL
const DEFAULT_TO_TOKEN = COMMON_TOKENS[1]; // USDC

export default function Home() {
  const { address } = useWalletAccount();
  const { tokens } = useTokenList();
  const { balances, getBalance, refreshBalances, loading: balancesLoading } =
    useTokenBalances();
  const { providers, venues, info } = useTitanMeta();
  const { executeSwap, status, error, txSignature, estimatedOutput, reset } =
    useSwap();

  const [fromToken, setFromToken] = useState<Token | null>(DEFAULT_FROM_TOKEN);
  const [toToken, setToToken] = useState<Token | null>(DEFAULT_TO_TOKEN);
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const [simulate, setSimulate] = useState(true);
  const [venuesOpen, setVenuesOpen] = useState(false);
  const [providersOpen, setProvidersOpen] = useState(false);

  const quoteInfo = useQuote(fromToken, toToken, amount, slippageBps, simulate);

  const handleFromTokenSelect = (token: Token) => {
    setFromToken(token);
    setAmount("");
  };

  // Tokens with a positive balance, richest first (for the "From" selector).
  const fromTokens = useMemo(() => {
    if (!address || balancesLoading) return [];
    const balanceMap = new Map<string, number>();
    balances.forEach((b) =>
      balanceMap.set(b.mint, b.balance / Math.pow(10, b.decimals))
    );
    return tokens
      .filter((t) => (balanceMap.get(t.address) || 0) > 0)
      .map((t) => ({ token: t, balance: balanceMap.get(t.address) || 0 }))
      .sort((a, b) => b.balance - a.balance)
      .map((x) => x.token);
  }, [tokens, balances, address, balancesLoading]);

  useEffect(() => {
    if (status === "success") {
      const id = setTimeout(() => refreshBalances(), 2000);
      return () => clearTimeout(id);
    }
  }, [status, refreshBalances]);

  // Default the "From" token to the wallet's richest holding.
  useEffect(() => {
    if (!address) {
      setFromToken(DEFAULT_FROM_TOKEN);
      return;
    }
    if (balancesLoading || fromTokens.length === 0) return;
    setFromToken((current) => {
      if (current && getBalance(current.address) > 0) return current;
      return fromTokens[0];
    });
  }, [address, balancesLoading, fromTokens, getBalance]);

  const fromBalance = fromToken ? getBalance(fromToken.address) : 0;
  const toBalance = toToken ? getBalance(toToken.address) : 0;
  const amountNum = parseFloat(amount) || 0;

  const hasInsufficientBalance = amountNum > fromBalance;
  const hasAmount = amountNum > 0;
  const tokensAreDifferent =
    fromToken && toToken && fromToken.address !== toToken.address;

  const canSwap =
    !!address &&
    !!fromToken &&
    !!toToken &&
    !!tokensAreDifferent &&
    hasAmount &&
    !hasInsufficientBalance &&
    (status === "idle" || status === "error") &&
    !quoteInfo.loading &&
    !!quoteInfo.winnerRoute;

  const handleSwap = async () => {
    if (!canSwap || !toToken || !quoteInfo.winnerRoute) return;
    try {
      await executeSwap(quoteInfo.winnerRoute, toToken);
    } catch (err) {
      console.error("Swap error:", err);
    }
  };

  // Retry the same inputs after a failure/denial — clears the error only.
  const handleTryAgain = () => reset();

  // Start fresh after a completed swap.
  const handleReset = () => {
    reset();
    setAmount("");
  };

  // Only these states should lock the form; error/success keep inputs editable.
  const inFlight =
    status === "building" ||
    status === "signing" ||
    status === "sending" ||
    status === "confirming";

  // Editing any swap input after an error/success returns to a clean idle state.
  useEffect(() => {
    if (status === "error" || status === "success") reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, fromToken, toToken, slippageBps, simulate]);

  const activeVenueLabels = useMemo(() => {
    const stepLabels = (quoteInfo.winnerRoute?.steps ?? []).map((s) =>
      s.label.toLowerCase()
    );
    const venueLowers = venues.labels.map((v) => v.toLowerCase());
    const venueSet = new Set(venueLowers);

    return new Set(
      venues.labels.filter((_, i) => {
        const vl = venueLowers[i];
        return stepLabels.some((sl) => {
          // If this step label has an exact venue match, only accept that venue.
          if (venueSet.has(sl)) return sl === vl;
          // Otherwise fall back to prefix overlap in either direction.
          return sl.startsWith(vl) || vl.startsWith(sl);
        });
      })
    );
  }, [quoteInfo.winnerRoute, venues.labels]);

  const showQuoteDetails =
    !inFlight && hasAmount && tokensAreDifferent && quoteInfo.outAmount;

  return (
    <SwapCard>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[2rem] leading-none">
            <span className="qn-highlight">Titan</span> DeFi Meta-Aggregation Swap
          </h1>
          <p className="mt-2 font-mono text-[11px] text-fg-dim uppercase tracking-wide flex items-center gap-2">
            Solana · via Quicknode
            {info && <span className="text-fg-ghost">{`protocol ${info.protocolVersion}`}</span>}
          </p>
        </div>
        <WalletButton />
      </div>

      {/* Two columns: swap form (left) · meta-aggregation (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left column — swap form */}
        <div className="space-y-4">
      {/* Controls */}
      <div className="panel">
        <div className="p-3 flex flex-wrap items-center justify-between gap-3 border-b border-border">
          <SlippageControl slippageBps={slippageBps} onChange={setSlippageBps} />
          <SimulationToggle simulate={simulate} onChange={setSimulate} disabled={inFlight} />
        </div>

        <div className="p-3 space-y-2">
          <TokenInput
            label="From"
            token={fromToken}
            amount={amount}
            balance={fromBalance}
            tokens={fromTokens}
            onTokenSelect={handleFromTokenSelect}
            onAmountChange={setAmount}
            disabled={inFlight || !address}
          />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (!inFlight) {
                  setFromToken(toToken);
                  setToToken(fromToken);
                  setAmount("");
                }
              }}
              disabled={inFlight}
              className="p-1.5 border border-border bg-bg-elev hover:bg-bg-hover text-fg-dim hover:text-fg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Reverse tokens"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          <TokenInput
            label="To (estimated)"
            token={toToken}
            amount={status === "idle" ? quoteInfo.outAmount || "" : estimatedOutput || ""}
            balance={toBalance}
            tokens={tokens}
            onTokenSelect={setToToken}
            onAmountChange={() => {}}
            disabled={inFlight || !address}
            readOnly
          />

          {fromToken && toToken && fromToken.address === toToken.address && (
            <p className="font-mono text-[10px] text-bear uppercase tracking-wide">
              Select a different token to swap to.
            </p>
          )}
        </div>

        {/* Quote details */}
        {showQuoteDetails && (
          <div className="px-3 pb-3 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-fg-dim">Rate</span>
              <span className="text-fg tabular-nums">
                1 {fromToken!.symbol} = {quoteInfo.exchangeRate} {toToken!.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-dim">Price impact</span>
              <span
                className="tabular-nums"
                style={{
                  color:
                    parseFloat(quoteInfo.priceImpactPct) > 1
                      ? "var(--bear)"
                      : "var(--foreground)",
                }}
              >
                {parseFloat(quoteInfo.priceImpactPct || "0").toFixed(4)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-dim">Slippage</span>
              <span className="text-fg tabular-nums">
                {(quoteInfo.slippageBps / 100).toFixed(2)}%
              </span>
            </div>
            {quoteInfo.mode === "price" && (
              <div className="text-fg-ghost text-[10px] pt-1">
                Connect a wallet for full provider routing and execution.
              </div>
            )}
          </div>
        )}

        {quoteInfo.error && (
          <div className="px-3 pb-3 font-mono text-xs text-bear">{quoteInfo.error}</div>
        )}
      </div>

      <StatusMessage
        status={status}
        error={error}
        txSignature={txSignature}
        estimatedOutput={estimatedOutput}
      />

      <SwapButton
        status={status}
        onClick={handleSwap}
        disabled={!canSwap}
        walletConnected={!!address}
        hasAmount={hasAmount}
        hasInsufficientBalance={hasInsufficientBalance}
      />

      {status === "error" && (
        <button
          type="button"
          onClick={handleTryAgain}
          className="w-full py-2 font-mono text-[11px] uppercase tracking-wide text-accent hover:opacity-80"
        >
          Try again
        </button>
      )}
      {status === "success" && (
        <button
          type="button"
          onClick={handleReset}
          className="w-full py-2 font-mono text-[11px] uppercase tracking-wide text-fg-dim hover:text-fg"
        >
          Start new swap
        </button>
      )}
        </div>

        {/* Right column — meta-aggregation */}
        <div className="space-y-4">
          {address && hasAmount && tokensAreDifferent ? (
            <>
              <ProviderRace
                quotes={quoteInfo.quotes}
                expectedWinner={quoteInfo.expectedWinner}
                toToken={toToken!}
                latencyMs={quoteInfo.latencyMs}
                loading={quoteInfo.loading}
              />
              <VenueSplit venues={venues} route={quoteInfo.winnerRoute} />
            </>
          ) : (
            <div className="panel">
              <div className="panel-header">
                <span className="qn-eyebrow">Provider Race</span>
              </div>
              <div className="p-4 font-mono text-xs text-fg-ghost leading-relaxed">
                {address
                  ? "Enter an amount to watch Titan's providers compete and see the route split across venues."
                  : "Connect a wallet and enter an amount to watch Titan's providers compete for the best route."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost pt-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            {providers.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => { setProvidersOpen((v) => !v); setVenuesOpen(false); }}
                  className="flex items-center gap-0.5 hover:text-fg transition-colors"
                >
                  {`${providers.length} providers`}
                  <svg
                    className={`w-3 h-3 transition-transform ${providersOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {` · `}
                <button
                  type="button"
                  onClick={() => { setVenuesOpen((v) => !v); setProvidersOpen(false); }}
                  className="flex items-center gap-0.5 hover:text-fg transition-colors"
                >
                  {`${venues.labels.length} venues`}
                  <svg
                    className={`w-3 h-3 transition-transform ${venuesOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </>
            ) : (
              "Titan Gateway"
            )}
          </span>
        </div>

        {providersOpen && providers.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-border">
            {providers.map((p) => {
              const active = quoteInfo.quotes.some((q) => q.provider === p.id);
              return (
                <span
                  key={p.id}
                  className={`px-1.5 py-0.5 border text-[9px] ${
                    active
                      ? "border-accent text-accent"
                      : "border-border text-fg-ghost"
                  }`}
                >
                  {p.id}
                </span>
              );
            })}
          </div>
        )}

        {venuesOpen && venues.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-border">
            {[...venues.labels].sort((a, b) => a.localeCompare(b)).map((label) => {
              const active = activeVenueLabels.has(label);
              return (
                <span
                  key={label}
                  className={`px-1.5 py-0.5 border text-[9px] ${
                    active
                      ? "border-accent text-accent"
                      : "border-border text-fg-ghost"
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </SwapCard>
  );
}
