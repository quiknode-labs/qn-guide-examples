"use client";

import { useState, useEffect } from "react";
import { fetchTokenList } from "@/lib/jupiter";
import type { Token } from "@/lib/types";

const COMMON_TOKENS: Token[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
];

export function useTokenList() {
  const [tokens, setTokens] = useState<Token[]>(COMMON_TOKENS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTokens = async () => {
      setLoading(true);
      setError(null);
      try {
        const tokenList = await fetchTokenList();
        // Merge common tokens with fetched list, prioritizing common tokens
        const commonAddresses = new Set(COMMON_TOKENS.map((t) => t.address));
        const otherTokens = tokenList.filter((t) => !commonAddresses.has(t.address));
        setTokens([...COMMON_TOKENS, ...otherTokens]);
      } catch (err) {
        console.error("Error loading token list:", err);
        setError(err instanceof Error ? err.message : "Failed to load tokens");
        // Fallback to common tokens only
        setTokens(COMMON_TOKENS);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  const searchTokens = (query: string): Token[] => {
    if (!query) return tokens.slice(0, 20); // Return first 20 tokens
    const lowerQuery = query.toLowerCase();
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery) ||
        token.address.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    tokens,
    loading,
    error,
    searchTokens,
  };
}

