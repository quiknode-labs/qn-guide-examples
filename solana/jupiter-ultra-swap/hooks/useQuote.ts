"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getSwapQuote } from "@/lib/jupiter";
import type { Token } from "@/lib/types";

export interface QuoteInfo {
  outAmount: string;
  priceImpactPct: string;
  slippageBps: number;
  exchangeRate: string;
  routeCount: number;
  routeLabels: string[];
  loading: boolean;
  error: string | null;
}

// Helper function to extract route labels and remove duplicates
function extractRouteLabels(routePlan: any[]): string[] {
  const labels = routePlan
    ?.map((route: any) => route.swapInfo?.label)
    .filter(Boolean) || [];
  
  // Remove consecutive duplicates
  return labels.filter((label: string, index: number, arr: string[]) => {
    return index === 0 || label !== arr[index - 1];
  });
}

// Helper function to reset quote info
function createEmptyQuoteInfo(loading: boolean = false): QuoteInfo {
  return {
    outAmount: "",
    priceImpactPct: "",
    slippageBps: 0,
    exchangeRate: "",
    routeCount: 0,
    routeLabels: [],
    loading,
    error: null,
  };
}

export function useQuote(
  fromToken: Token | null,
  toToken: Token | null,
  amount: string
) {
  const { publicKey } = useWallet();
  const [quoteInfo, setQuoteInfo] = useState<QuoteInfo>(createEmptyQuoteInfo());

  useEffect(() => {
    // Reset quote info when dependencies change
    setQuoteInfo(createEmptyQuoteInfo());

    // Don't fetch if required values are missing
    if (
      !fromToken ||
      !toToken ||
      !amount ||
      !publicKey ||
      fromToken.address === toToken.address
    ) {
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || isNaN(amountNum)) {
      return;
    }

    // Set loading state
    setQuoteInfo(createEmptyQuoteInfo(true));

    // Debounce: wait 500ms before fetching to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      try {
        // Convert amount to smallest unit (e.g., lamports for SOL)
        const amountInSmallestUnit = Math.floor(
          amountNum * Math.pow(10, fromToken.decimals)
        );

        // Fetch quote from Jupiter Ultra API
        const quote = await getSwapQuote(
          fromToken.address,
          toToken.address,
          amountInSmallestUnit,
          50, // 0.5% slippage tolerance
          publicKey.toBase58()
        );

        // Convert output amount back to readable format
        const outAmountNative = (
          parseInt(quote.outAmount) / Math.pow(10, toToken.decimals)
        ).toFixed(6);

        // Calculate exchange rate
        const exchangeRate =
          amountNum > 0
            ? (parseFloat(outAmountNative) / amountNum).toFixed(6)
            : "0";

        // Extract route labels
        const routeLabels = extractRouteLabels(quote.routePlan || []);

        // Update quote info with results
        setQuoteInfo({
          outAmount: outAmountNative,
          priceImpactPct: quote.priceImpactPct || "0",
          slippageBps: quote.slippageBps || 50,
          exchangeRate,
          routeCount: routeLabels.length,
          routeLabels,
          loading: false,
          error: null,
        });
      } catch (err) {
        setQuoteInfo({
          ...createEmptyQuoteInfo(),
          error: err instanceof Error ? err.message : "Failed to fetch quote",
        });
      }
    }, 500);

    // Cleanup: cancel timeout if component unmounts or dependencies change
    return () => clearTimeout(timeoutId);
  }, [fromToken, toToken, amount, publicKey]);

  return quoteInfo;
}

