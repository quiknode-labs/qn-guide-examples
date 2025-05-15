import { useState, useEffect } from "react";
import { fetchSwapQuote } from "../lib/api";
import type { SwapQuote, UseSwapQuoteParams } from "../types";

export function useSwapQuote({
  fromToken,
  toToken,
  amount,
  gasPrice,
}: UseSwapQuoteParams) {
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getQuote() {
      // Don't fetch if we don't have all the required data
      if (!fromToken || !toToken || !amount || amount === "0" || !gasPrice) {
        setQuote(null);
        return;
      }

      try {
        setIsLoadingQuote(true);



        const quoteData = await fetchSwapQuote({
          inTokenAddress: fromToken.address,
          outTokenAddress: toToken.address,
          amount,
          gasPrice,
        });

        setQuote(quoteData);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch quote")
        );
        console.error("Error fetching swap quote:", err);
      } finally {
        setIsLoadingQuote(false);
      }
    }

    getQuote();
  }, [fromToken, toToken, amount, gasPrice]);

  return { quote, isLoadingQuote, error };
}
