"use client";

import { useState, useEffect } from "react";
import { fetchTokenList, COMMON_TOKENS } from "@/lib/tokens";
import type { Token } from "@/lib/types";

export function useTokenList() {
  const [tokens, setTokens] = useState<Token[]>(COMMON_TOKENS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchTokenList();
        const commonAddresses = new Set(COMMON_TOKENS.map((t) => t.address));
        const others = list.filter((t) => !commonAddresses.has(t.address));
        setTokens([...COMMON_TOKENS, ...others]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tokens");
        setTokens(COMMON_TOKENS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const searchTokens = (query: string): Token[] => {
    if (!query) return tokens.slice(0, 20);
    const q = query.toLowerCase();
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  };

  return { tokens, loading, error, searchTokens };
}
