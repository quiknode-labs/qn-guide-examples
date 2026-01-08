"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchTokenBalances } from "@/lib/jupiter";
import type { TokenBalance } from "@/lib/types";

export function useTokenBalances() {
  const { publicKey } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track current publicKey to prevent stale updates in refreshBalances
  const publicKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Update ref to track current publicKey
    publicKeyRef.current = publicKey?.toBase58() || null;

    // Reset balances when publicKey changes
    setBalances([]);
    setError(null);

    if (!publicKey) {
      setLoading(false);
      return;
    }

    // Create AbortController to cancel in-flight requests
    const abortController = new AbortController();
    let isCancelled = false;
    const currentPublicKey = publicKey.toBase58();

    setLoading(true);

    const fetchBalances = async () => {
      try {
        const tokenBalances = await fetchTokenBalances(
          currentPublicKey,
          abortController.signal
        );

        // Check if request was cancelled or publicKey changed before updating state
        if (isCancelled || publicKeyRef.current !== currentPublicKey) {
          return;
        }

        setBalances(tokenBalances);
        setError(null);
      } catch (err) {
        // Don't update state if request was aborted
        if (isCancelled || (err instanceof Error && err.name === "AbortError")) {
          return;
        }

        // Check again if cancelled or publicKey changed before setting error
        if (isCancelled || publicKeyRef.current !== currentPublicKey) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to fetch balances");
        console.error("Error fetching balances:", err);
      } finally {
        // Only update loading state if not cancelled and publicKey hasn't changed
        if (!isCancelled && publicKeyRef.current === currentPublicKey) {
          setLoading(false);
        }
      }
    };

    fetchBalances();

    // Cleanup: abort in-flight requests when publicKey changes
    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [publicKey]); // Only recreate when publicKey changes

  const refreshBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances([]);
      return;
    }

    const currentPublicKey = publicKey.toBase58();
    const abortController = new AbortController();
    let isCancelled = false;

    setLoading(true);
    setError(null);
    try {
      const tokenBalances = await fetchTokenBalances(
        currentPublicKey,
        abortController.signal
      );

      // Check if request was cancelled or publicKey changed before updating state
      if (isCancelled || publicKeyRef.current !== currentPublicKey) {
        return;
      }

      setBalances(tokenBalances);
      setError(null);
    } catch (err) {
      // Don't update state if request was aborted
      if (isCancelled || (err instanceof Error && err.name === "AbortError")) {
        return;
      }

      // Check again if cancelled or publicKey changed before setting error
      if (isCancelled || publicKeyRef.current !== currentPublicKey) {
        return;
      }

      setError(err instanceof Error ? err.message : "Failed to fetch balances");
      console.error("Error fetching balances:", err);
    } finally {
      // Only update loading state if not cancelled and publicKey hasn't changed
      if (!isCancelled && publicKeyRef.current === currentPublicKey) {
        setLoading(false);
      }
    }
  }, [publicKey]);

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

