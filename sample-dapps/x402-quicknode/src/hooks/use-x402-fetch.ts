"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WalletClient } from "viem";
import type { Method, MethodExecutionResult } from "@/lib/types";
import { createBrowserX402Fetch, executeMethod } from "@/lib/x402";

type UseX402FetchParams = {
  walletClient: WalletClient | undefined;
  jwt: string | null;
};

type UseX402FetchResult = {
  x402Fetch: typeof fetch | null;
  results: MethodExecutionResult[];
  lastResult: MethodExecutionResult | null;
  isExecuting: boolean;
  executionError: string | null;
  execute: (method: Method) => Promise<MethodExecutionResult>;
  clearResults: () => void;
};

export function useX402Fetch({ walletClient, jwt }: UseX402FetchParams): UseX402FetchResult {
  const [results, setResults] = useState<MethodExecutionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const x402Fetch = useMemo(() => {
    if (!walletClient || !jwt) {
      return null;
    }

    return createBrowserX402Fetch(walletClient, jwt);
  }, [jwt, walletClient]);

  const execute = useCallback(
    async (method: Method) => {
      if (!x402Fetch || !jwt) {
        throw new Error("Authentication and wallet connection are required.");
      }

      setIsExecuting(true);
      setExecutionError(null);

      try {
        const result = await executeMethod(x402Fetch, jwt, method);
        setResults((current) => [result, ...current]);

        if (!result.ok) {
          setExecutionError(result.error ?? `Request failed with status ${result.status}`);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to execute x402 request.";

        setExecutionError(errorMessage);

        const errorResult: MethodExecutionResult = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          methodId: method.id,
          methodName: method.name,
          network: method.network,
          networkDisplay: method.networkDisplay,
          protocol: method.protocol,
          requestedAt: new Date().toISOString(),
          status: 0,
          ok: false,
          data: null,
          error: errorMessage,
          paymentResponse: undefined,
        };
        setResults((current) => [errorResult, ...current]);

        return errorResult;
      } finally {
        setIsExecuting(false);
      }
    },
    [x402Fetch, jwt],
  );

  // Clear results and errors when wallet/session changes
  useEffect(() => {
    setResults([]);
    setExecutionError(null);
  }, [jwt]);

  const clearResults = useCallback(() => {
    setResults([]);
    setExecutionError(null);
  }, []);

  return {
    x402Fetch,
    results,
    lastResult: results[0] ?? null,
    isExecuting,
    executionError,
    execute,
    clearResults,
  };
}
