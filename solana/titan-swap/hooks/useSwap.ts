"use client";

import { useState } from "react";
import {
  type Rpc,
  type Signature,
  type SolanaRpcApi,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { buildSwapTransaction } from "@/lib/build-swap-tx";
import { createRpc } from "@/lib/rpc";
import { useTxSigner } from "@/app/providers/WalletProvider";
import type { Token, SwapStatus, TitanSwapRoute } from "@/lib/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Poll getSignatureStatuses until confirmed, the tx errors, or the blockhash
 *  expires — an HTTP-only alternative to the WebSocket confirmTransaction. */
async function confirmBySignature(
  rpc: Rpc<SolanaRpcApi>,
  signature: Signature,
  lastValidBlockHeight: number
) {
  while (true) {
    const { value } = await rpc.getSignatureStatuses([signature]).send();
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
    const blockHeight = await rpc.getBlockHeight({ commitment: "confirmed" }).send();
    if (blockHeight > BigInt(lastValidBlockHeight)) {
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
 * route with @solana/kit, sign it with the wallet's Kit signer
 * (`signTransactionMessageWithSigners`), and submit + confirm through Quicknode
 * RPC — entirely via Kit, no web3.js.
 */
export function useSwap() {
  const signer = useTxSigner();
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string | null>(null);

  const executeSwap = async (route: TitanSwapRoute, toToken: Token) => {
    if (!signer) {
      throw new Error("Wallet not connected");
    }

    setError(null);
    setTxSignature(null);
    setEstimatedOutput(
      (parseInt(route.outAmount) / Math.pow(10, toToken.decimals)).toFixed(6)
    );

    const rpc = createRpc();

    try {
      // Build the transaction from Titan's instructions + lookup tables.
      setStatus("building");
      const { message, lastValidBlockHeight } = await buildSwapTransaction(
        route,
        signer,
        rpc
      );

      // Sign in the wallet via the Kit signer attached to the message.
      setStatus("signing");
      const signedTransaction = await signTransactionMessageWithSigners(message);

      // Submit through Quicknode RPC.
      setStatus("sending");
      const signature = getSignatureFromTransaction(signedTransaction);
      await rpc
        .sendTransaction(getBase64EncodedWireTransaction(signedTransaction), {
          encoding: "base64",
          skipPreflight: false,
          preflightCommitment: "confirmed",
        })
        .send();
      setTxSignature(signature);

      // Confirm by polling over HTTP (the RPC proxy carries no WebSocket).
      setStatus("confirming");
      await confirmBySignature(rpc, signature, lastValidBlockHeight);

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
