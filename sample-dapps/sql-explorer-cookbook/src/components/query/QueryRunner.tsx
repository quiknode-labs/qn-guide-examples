"use client";

import { useState, useCallback } from "react";
import type { PrebuiltQuery, SQLExplorerResponse } from "@/types";
import { useQueryExecution } from "@/lib/hooks/useQueryExecution";
import { executeQuery } from "@/lib/sql-explorer";
import { substituteParams } from "@/lib/params";
import QueryStats from "./QueryStats";
import ResultsTable from "./ResultsTable";
import ResultsChart from "./ResultsChart";
import CodeSnippets from "./CodeSnippets";
import { hasChartableData } from "@/lib/chart-utils";

interface QueryRunnerProps {
  query: PrebuiltQuery;
  defaultOpen?: boolean;
  onData?: (data: SQLExplorerResponse) => void;
}

export default function QueryRunner({
  query,
  defaultOpen,
  onData,
}: QueryRunnerProps) {
  const { data, error, isLoading, run } = useQueryExecution(onData);

  // Parameter state
  const [params, setParams] = useState<Record<string, string>>(() => {
    if (!query.parameters) return {};
    const initial: Record<string, string> = {};
    for (const p of query.parameters) {
      initial[p.name] = p.default;
    }
    return initial;
  });

  // Track which params are currently fetching a sample
  const [fetchingSample, setFetchingSample] = useState<Record<string, boolean>>(
    {},
  );

  // Results view tab
  const [activeView, setActiveView] = useState<"table" | "chart">("table");

  const resolvedSql = query.parameterizable
    ? substituteParams(query.sql, params)
    : query.sql;

  const handleRun = useCallback(() => {
    run(resolvedSql);
  }, [run, resolvedSql]);

  const fetchSampleValue = useCallback(
    async (paramName: string, sampleQuery: string) => {
      setFetchingSample((prev) => ({ ...prev, [paramName]: true }));
      try {
        const result = await executeQuery(sampleQuery);
        if (result.data.length > 0 && result.meta.length > 0) {
          const firstCol = result.meta[0].name;
          const value = String(result.data[0][firstCol] ?? "");
          if (value) {
            setParams((prev) => ({ ...prev, [paramName]: value }));
          }
        }
      } catch {
        // silently fail — sample fetch is best-effort
      } finally {
        setFetchingSample((prev) => ({ ...prev, [paramName]: false }));
      }
    },
    [],
  );

  return (
    <div className="space-y-4">
      {/* Parameter inputs */}
      {query.parameterizable && query.parameters && (
        <div className="flex flex-wrap gap-3">
          {query.parameters.map((param) => (
            <div key={param.name} className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {param.label}
              </label>
              <div className="flex gap-2">
                <input
                  type={param.type === "number" ? "number" : "text"}
                  value={params[param.name] || ""}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      [param.name]: e.target.value,
                    }))
                  }
                  placeholder={param.placeholder}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-mono placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                />
                {param.sampleQuery && (
                  <button
                    onClick={() =>
                      fetchSampleValue(param.name, param.sampleQuery!)
                    }
                    disabled={fetchingSample[param.name]}
                    className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-text)] disabled:opacity-50"
                    title="Fetch a real address from recent on-chain data"
                  >
                    {fetchingSample[param.name] ? (
                      <svg
                        className="h-3.5 w-3.5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      "Try sample"
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Run button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Running...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Run Query
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-4">
          <QueryStats
            statistics={data.statistics}
            rowCount={data.rows}
            totalRows={data.rows_before_limit_at_least}
          />

          {/* View tabs — only show chart tab when data is chartable */}
          {hasChartableData(query.chartConfig, data.meta, data.data) ? (
            <div className="flex gap-1 rounded-lg bg-[var(--color-bg-secondary)] p-1 w-fit">
              <button
                onClick={() => setActiveView("table")}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  activeView === "table"
                    ? "bg-[var(--color-bg)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setActiveView("chart")}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  activeView === "chart"
                    ? "bg-[var(--color-bg)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                Chart
              </button>
            </div>
          ) : null}

          {activeView === "table" && (
            <ResultsTable meta={data.meta} data={data.data} />
          )}

          {activeView === "chart" && (
            <ResultsChart
              meta={data.meta}
              data={data.data}
              chartConfig={query.chartConfig}
            />
          )}
        </div>
      )}

      {/* Code snippets */}
      <CodeSnippets sql={resolvedSql} />
    </div>
  );
}
