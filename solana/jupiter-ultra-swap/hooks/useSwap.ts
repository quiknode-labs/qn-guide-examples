"use client";

import { useState, useRef } from "react";
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
  
  // Synchronous guard to prevent concurrent swap executions
  // This ref is updated immediately (synchronously), unlike state which is batched
  const isExecutingRef = useRef(false);

  const executeSwap = async (
    fromToken: Token,
    toToken: Token,
    amount: number
  ) => {
    if (!publicKey || !signTransaction) {
      throw new Error("Wallet not connected");
    }

    // Synchronous guard: prevent concurrent executions
    // This check happens immediately, before any async operations or state updates
    if (isExecutingRef.current) {
      throw new Error("Swap already in progress");
    }
    
    // Set guard synchronously to prevent race conditions
    isExecutingRef.current = true;

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
      // Use BigInt to preserve precision when parsing large amounts (e.g., tokens with 18 decimals)
      const outAmountBigInt = BigInt(quote.outAmount);
      const decimalsBigInt = BigInt(10 ** toToken.decimals);
      // For display, multiply by 10^6 to preserve 6 decimal places, then divide
      // This preserves precision better than converting both to Number first
      const displayPrecision = BigInt(1000000); // 10^6 for 6 decimal places
      const scaledAmount = (outAmountBigInt * displayPrecision) / decimalsBigInt;
      setEstimatedOutput(
        (Number(scaledAmount) / Number(displayPrecision)).toFixed(6)
      );

      // Step 3: Get transaction from quote (Ultra API includes it in quote)
      setStatus("signing");
      const swapResponse = await getSwapTransaction(quote, publicKey.toBase58());

      // Step 4: Deserialize and sign the transaction
      // NOTE: This is the ONLY place using @solana/web3.js v1. Required because:
      // - @solana/wallet-adapter-react expects v1 VersionedTransaction for signTransaction()
      // - Jupiter Ultra API returns transactions in v1 format
      // - @solana/kit (v2) uses a different transaction model incompatible with wallet adapters
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
    } finally {
      // Always reset the guard, even if an error occurred
      isExecutingRef.current = false;
    }
  };

  const reset = () => {
    setStatus("idle");
    setError(null);
    setTxSignature(null);
    setEstimatedOutput(null);
    // Reset the execution guard when manually resetting
    isExecutingRef.current = false;
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

