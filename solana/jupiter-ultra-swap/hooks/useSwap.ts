"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getSwapQuote,
  getSwapTransaction,
  executeUltraSwap,
} from "@/lib/jupiter";
import type { Token, SwapStatus } from "@/lib/types";

/**
 * Hook to manage swap execution flow
 * Handles: quote → transaction → signing → execution
 */
export function useSwap() {
  const { publicKey, signTransaction } = useWallet();
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string | null>(null);

  const executeSwap = async (
    fromToken: Token,
    toToken: Token,
    amount: number
  ) => {
    if (!publicKey || !signTransaction) {
      throw new Error("Wallet not connected");
    }

    setStatus("quoting");
    setError(null);
    setTxSignature(null);

    try {
      // Step 1: Convert amount to smallest unit (e.g., lamports for SOL)
      const amountInSmallestUnit = Math.floor(
        amount * Math.pow(10, fromToken.decimals)
      );

      // Step 2: Get swap quote from Jupiter Ultra API
      const quote = await getSwapQuote(
        fromToken.address,
        toToken.address,
        amountInSmallestUnit,
        50, // 0.5% slippage tolerance
        publicKey.toBase58()
      );

      // Store estimated output for display
      setEstimatedOutput(
        (parseInt(quote.outAmount) / Math.pow(10, toToken.decimals)).toFixed(6)
      );

      // Step 3: Get transaction from quote (Ultra API includes it in quote)
      setStatus("signing");
      const swapResponse = await getSwapTransaction(quote, publicKey.toBase58());

      // Step 4: Deserialize and sign the transaction
      const { VersionedTransaction } = await import("@solana/web3.js");
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(swapResponse.swapTransaction, "base64")
      );

      const signedTransaction = await signTransaction(transaction);

      // Step 5: Execute the signed transaction via Jupiter Ultra API
      setStatus("executing");
      const signedBuffer = signedTransaction.serialize();
      const executeResponse = await executeUltraSwap(
        Buffer.from(signedBuffer).toString("base64"),
        (swapResponse as any)._ultraRequestId
      );

      // Success!
      setTxSignature(executeResponse.signature);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Swap failed");
      throw err;
    }
  };

  const reset = () => {
    setStatus("idle");
    setError(null);
    setTxSignature(null);
    setEstimatedOutput(null);
  };

  return {
    executeSwap,
    status,
    error,
    txSignature,
    estimatedOutput,
    reset,
  };
}

