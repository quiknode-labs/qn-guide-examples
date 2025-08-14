"use client";

import { useState } from "react";
import type { Hash, Address } from "viem";
import { parseEther } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import type { TransactionTracker } from "@/types";
import { DEMO_CONFIG } from "@/lib/constants";
import { flashblocksClient, traditionalClient } from "@/lib/clients";

export const useTransactionTracking = () => {
  const [flashblocksTracker, setFlashblocksTracker] =
    useState<TransactionTracker | null>(null);
  const [traditionalTracker, setTraditionalTracker] =
    useState<TransactionTracker | null>(null);
  const [isTransactionInProgress, setIsTransactionInProgress] = useState(false);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const sendTransaction = async () => {
    if (isTransactionInProgress || !address || !walletClient) return;

    setIsTransactionInProgress(true);

    try {
      // Real implementation using Wagmi/Viem
      const hash = await walletClient.sendTransaction({
        to: address,
        value: parseEther(DEMO_CONFIG.TEST_AMOUNT),
      });

      const startTime = Date.now();

      // Initialize both trackers
      const initialTracker: TransactionTracker = {
        hash,
        status: "pending",
        startTime,
      };

      setFlashblocksTracker(initialTracker);
      setTraditionalTracker(initialTracker);

      // Track Flashblocks confirmation
      trackTransaction(
        hash,
        address,
        startTime,
        flashblocksClient,
        setFlashblocksTracker,
        "Flashblocks"
      );

      // Track Traditional confirmation
      trackTransaction(
        hash,
        address,
        startTime,
        traditionalClient,
        setTraditionalTracker,
        "Traditional"
      );
    } catch (error) {
      console.error("Transaction failed:", error);
      setIsTransactionInProgress(false);
    }
  };

  const trackTransaction = async (
    hash: Hash,
    address: Address,
    startTime: number,
    client: typeof flashblocksClient | typeof traditionalClient,
    setTracker: typeof setFlashblocksTracker | typeof setTraditionalTracker,
    clientName: string
  ) => {
    // // Wait for transaction receipt
    // const receipt = await flashblocksClient.waitForTransactionReceipt({
    //   hash,
    //   pollingInterval: 50,
    //   retryDelay: 50,
    //   timeout: 10000,
    // });

    try {
      // Poll blocks until transaction is included
      let confirmed = false;
      let receipt;
      let confirmationTime = 0;
      const maxAttempts = 200; // 200 * 100ms = 20 seconds max
      let attempts = 0;

      while (!confirmed && attempts < maxAttempts) {
        attempts++;

        try {
          // Get the latest block with transactions
          const block = await client.getBlock({
            includeTransactions: true,
          });

          console.log(
            `[${clientName}] Checking block ${block.number} (${block.hash}). Attempt: ${attempts}`
          );

          // Check if our transaction hash is in the block's transactions
          const txInBlock = block.transactions.find(
            (tx: any) => tx.hash === hash
          );

          if (txInBlock) {
            confirmed = true;
            confirmationTime = Date.now() - startTime;
            // Get the full receipt for additional data
            receipt = await client.getTransactionReceipt({ hash });

            console.log(
              `[${clientName}] Tx ${hash} confirmed in block ${block.number}`
            );
            break;
          }

          // Wait before next attempt
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (blockError) {
          console.warn(
            `[${clientName}] Block fetch attempt failed:`,
            blockError
          );
          // Continue trying
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (!confirmed || !receipt) {
        throw new Error("Transaction confirmation timeout");
      }

      console.log(`[${clientName}] Confirmation:`, receipt);

      const balanceAfter = await client.getBalance({ address });

      // Update trackers
      
      setTracker((prev) =>
        prev
          ? {
              ...prev,
              status: "confirmed",
              confirmationTime,
              receipt,
              balanceAfter
            }
          : null
      );

      setIsTransactionInProgress(false);
    } catch (error) {
      console.error(`${clientName} tracking failed:`, error);
      if (clientName === "Traditional") {
        setIsTransactionInProgress(false);
      }
    }
  };

  const resetTransactions = () => {
    setFlashblocksTracker(null);
    setTraditionalTracker(null);
    setIsTransactionInProgress(false);
  };

  return {
    sendTransaction,
    resetTransactions,
    flashblocksTracker,
    traditionalTracker,
    isTransactionInProgress,
  };
};
