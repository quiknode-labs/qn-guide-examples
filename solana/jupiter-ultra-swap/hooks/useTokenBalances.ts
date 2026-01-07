"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchTokenBalances } from "@/lib/jupiter";
import type { TokenBalance } from "@/lib/types";

export function useTokenBalances() {
  const { publicKey } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const tokenBalances = await fetchTokenBalances(publicKey.toBase58());
      setBalances(tokenBalances);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
      console.error("Error fetching balances:", err);
    } finally {
      setLoading(false);
    }
  }, [publicKey]); // Only recreate when publicKey changes

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  const getBalance = useCallback((mint: string): number => {
    const balance = balances.find((b) => b.mint === mint);
    return balance ? balance.balance / Math.pow(10, balance.decimals) : 0;
  }, [balances]); // Only recreate when balances change

  return {
    balances,
    loading,
    error,
    refreshBalances,
    getBalance,
  };
}

