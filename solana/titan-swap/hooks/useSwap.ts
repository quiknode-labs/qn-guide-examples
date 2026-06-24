"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";
import { buildSwapTransaction } from "@/lib/build-swap-tx";
import type { Token, SwapStatus, TitanSwapRoute } from "@/lib/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Poll getSignatureStatuses until confirmed, the tx errors, or the blockhash
 *  expires — an HTTP-only alternative to the WebSocket confirmTransaction. */
async function confirmBySignature(
  connection: Connection,
  signature: string,
  lastValidBlockHeight: number
) {
  while (true) {
    const { value } = await connection.getSignatureStatuses([signature]);
    const status = value[0];
    if (status?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      return;
    }
    const blockHeight = await connection.getBlockHeight("confirmed");
    if (blockHeight > lastValidBlockHeight) {
      throw new Error("Transaction expired before confirmation");
    }
    await sleep(1500);
  }
}

/**
 * Swap execution: build → sign → send → confirm.
 *
 * Unlike an execute-for-you aggregator, Titan hands back instructions and we
 * own the transaction lifecycle. We build a v0 transaction from the winning
 * route, the wallet signs it, and we submit + confirm through QuickNode RPC.
 */
export function useSwap() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string | null>(null);

  const executeSwap = async (route: TitanSwapRoute, toToken: Token) => {
    if (!publicKey || !signTransaction) {
      throw new Error("Wallet not connected");
    }

    setError(null);
    setTxSignature(null);
    setEstimatedOutput(
      (parseInt(route.outAmount) / Math.pow(10, toToken.decimals)).toFixed(6)
    );

    try {
      // Build the transaction from Titan's instructions + lookup tables.
      setStatus("building");
      const { transaction, blockhash, lastValidBlockHeight } =
        await buildSwapTransaction(route, publicKey, connection);

      // Sign in the wallet.
      setStatus("signing");
      const signed = await signTransaction(transaction);

      // Submit through QuickNode RPC.
      setStatus("sending");
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 5,
      });
      setTxSignature(signature);

      // Confirm by polling over HTTP (the RPC proxy carries no WebSocket).
      setStatus("confirming");
      await confirmBySignature(connection, signature, lastValidBlockHeight);

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

  return { executeSwap, status, error, txSignature, estimatedOutput, reset };
}
