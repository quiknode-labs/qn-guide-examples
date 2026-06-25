"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getTitanSwap, getTitanPrice } from "@/lib/titan";
import type { Token, TitanSwapRoute } from "@/lib/types";

export interface QuoteInfo {
  /** Readable output amount of the best route. */
  outAmount: string;
  exchangeRate: string;
  priceImpactPct: string;
  slippageBps: number;
  /** All competing provider routes, best output first (only when connected). */
  quotes: TitanSwapRoute[];
  expectedWinner: string | null;
  /** The route handed to the swap hook for execution. */
  winnerRoute: TitanSwapRoute | null;
  /** "swap" = full meta-aggregation (wallet connected); "price" = indicative. */
  mode: "swap" | "price";
  latencyMs: number | null;
  loading: boolean;
  error: string | null;
}

function emptyQuote(loading = false, mode: "swap" | "price" = "price"): QuoteInfo {
  return {
    outAmount: "",
    exchangeRate: "",
    priceImpactPct: "",
    slippageBps: 0,
    quotes: [],
    expectedWinner: null,
    winnerRoute: null,
    mode,
    latencyMs: null,
    loading,
    error: null,
  };
}

export function useQuote(
  fromToken: Token | null,
  toToken: Token | null,
  amount: string,
  slippageBps: number,
  simulate: boolean
) {
  const { publicKey } = useWallet();
  const [quoteInfo, setQuoteInfo] = useState<QuoteInfo>(emptyQuote());

  useEffect(() => {
    const mode: "swap" | "price" = publicKey ? "swap" : "price";
    setQuoteInfo(emptyQuote(false, mode));

    if (!fromToken || !toToken || !amount || fromToken.address === toToken.address) {
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    setQuoteInfo(emptyQuote(true, mode));

    // Guard against out-of-order responses: if the inputs change (or the
    // component unmounts) while a request is in flight, the cleanup flips
    // this flag so the stale response is discarded instead of overwriting
    // state for the current amount/pair.
    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      const amountRaw = Math.floor(
        amountNum * Math.pow(10, fromToken.decimals)
      ).toString();
      const started = performance.now();

      try {
        if (publicKey) {
          // Full meta-aggregation: every provider competes, winner is executable.
          const res = await getTitanSwap({
            inputMint: fromToken.address,
            outputMint: toToken.address,
            amount: amountRaw,
            userPublicKey: publicKey.toBase58(),
            slippageBps,
            simulate,
          });
          if (cancelled) return;
          const latencyMs = Math.round(performance.now() - started);

          const winner = res.quotes[0] ?? null;
          if (!winner) {
            setQuoteInfo({ ...emptyQuote(false, "swap"), error: "No route found", latencyMs });
            return;
          }

          const out = parseInt(winner.outAmount) / Math.pow(10, toToken.decimals);
          setQuoteInfo({
            outAmount: out.toFixed(6),
            exchangeRate: (out / amountNum).toFixed(6),
            priceImpactPct: winner.priceImpact != null ? String(winner.priceImpact) : "0",
            slippageBps: winner.slippageBps || slippageBps,
            quotes: res.quotes,
            expectedWinner: res.expectedWinner,
            winnerRoute: winner,
            mode: "swap",
            latencyMs,
            loading: false,
            error: null,
          });
        } else {
          // No wallet: indicative price only (no instructions, no provider race).
          const res = await getTitanPrice(
            fromToken.address,
            toToken.address,
            amountRaw,
            slippageBps
          );
          if (cancelled) return;
          const latencyMs = Math.round(performance.now() - started);
          const out = parseInt(res.outputAmount) / Math.pow(10, toToken.decimals);
          setQuoteInfo({
            ...emptyQuote(false, "price"),
            outAmount: isNaN(out) ? "" : out.toFixed(6),
            exchangeRate: isNaN(out) ? "" : (out / amountNum).toFixed(6),
            priceImpactPct: res.priceImpact != null ? String(res.priceImpact) : "0",
            slippageBps,
            latencyMs,
          });
        }
      } catch (err) {
        if (cancelled) return;
        const raw = err instanceof Error ? err.message : "Failed to fetch quote";
        const friendly = raw.includes("No routes found") || raw.includes("404")
          ? `No route available for this pair or amount. Try a different token or smaller size.`
          : raw.includes("400")
          ? "Invalid swap parameters. Check the token pair and amount."
          : raw.includes("429")
          ? "Too many requests — please wait a moment and try again."
          : raw.includes("5")  // 5xx
          ? "Titan Gateway is temporarily unavailable. Try again shortly."
          : raw;
        setQuoteInfo({ ...emptyQuote(false, mode), error: friendly });
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fromToken, toToken, amount, slippageBps, simulate, publicKey]);

  return quoteInfo;
}
