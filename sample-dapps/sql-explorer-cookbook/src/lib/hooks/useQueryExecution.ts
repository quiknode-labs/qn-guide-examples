"use client";

import { useState, useCallback } from "react";
import type { SQLExplorerResponse } from "@/types";
import { executeQuery } from "@/lib/sql-explorer";

interface UseQueryExecutionReturn {
  data: SQLExplorerResponse | null;
  error: string | null;
  isLoading: boolean;
  run: (sql: string) => Promise<void>;
}

export function useQueryExecution(): UseQueryExecutionReturn {
  const [data, setData] = useState<SQLExplorerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(async (sql: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await executeQuery(sql);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, error, isLoading, run };
}
