"use client";

import { useCallback, useEffect, useState } from "react";
import { getCredits } from "@/lib/x402";

type UseCreditsParams = {
  jwt: string | null;
  isAuthenticated: boolean;
  pollIntervalMs?: number;
};

type UseCreditsResult = {
  credits: number;
  accountId: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useCredits({
  jwt,
  isAuthenticated,
  pollIntervalMs = 5000,
}: UseCreditsParams): UseCreditsResult {
  const [credits, setCredits] = useState(0);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!jwt || !isAuthenticated) {
      setCredits(0);
      setAccountId(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCredits(jwt);
      setCredits(response.credits);
      setAccountId(response.accountId);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch credits.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, jwt]);

  useEffect(() => {
    if (!jwt || !isAuthenticated) {
      setCredits(0);
      setAccountId(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, jwt, pollIntervalMs, refresh]);

  return { credits, accountId, isLoading, error, refresh };
}
