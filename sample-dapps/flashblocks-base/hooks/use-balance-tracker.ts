"use client";

import { useState, useEffect } from "react";
import type { Address } from "viem";

import { flashblocksClient, traditionalClient } from "@/lib/clients";

type ClientType = "flashblocks" | "traditional";

export const useBalanceTracker = (
  address: Address | undefined,
  clientType: ClientType
) => {
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBalance(BigInt(0));
      return;
    }

    // Fetch initial balance only once when address connects
    const fetchInitialBalance = async () => {
      try {
        setIsLoading(true);
        const client =
          clientType === "flashblocks" ? flashblocksClient : traditionalClient;
        const newBalance = await client.getBalance({ address });
        setBalance(newBalance);
      } catch (error) {
        console.error(`Failed to fetch ${clientType} balance:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialBalance();
  }, [address, clientType]);

  // Function to update balance externally (called from transaction tracking)
  const updateBalance = (newBalance: bigint) => {
    setBalance(newBalance);
  };

  return { balance, isLoading, updateBalance };
};
