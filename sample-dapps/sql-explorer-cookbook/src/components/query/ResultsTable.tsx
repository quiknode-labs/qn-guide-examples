"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import type { ColumnMeta } from "@/types";
import { formatNumber, formatUsd, isUsdColumn } from "@/lib/format";

interface ResultsTableProps {
  meta: ColumnMeta[];
  data: Record<string, unknown>[];
}

const PAGE_SIZE = 50;

function isNumericType(type: string): boolean {
  const lower = type.toLowerCase();
  return (
    lower.includes("int") ||
    lower.includes("float") ||
    lower.includes("decimal") ||
    lower.includes("double")
  );
}

function formatCell(value: unknown, colName: string, colType: string): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (isUsdColumn(colName)) return formatUsd(value);
    if (isNumericType(colType)) return formatNumber(value);
  }
  return String(value);
}

export default function ResultsTable({ meta, data }: ResultsTableProps) {
  const [visibleRows, setVisibleRows] = useState(PAGE_SIZE);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
  }, [data, sortCol, sortAsc]);

  const displayed = sorted.slice(0, visibleRows);

  function handleSort(colName: string) {
    if (sortCol === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colName);
      setSortAsc(true);
    }
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-[var(--color-text-secondary)]">
        No results
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              {meta.map((col) => (
                <th
                  key={col.name}
                  onClick={() => handleSort(col.name)}
                  className={clsx(
                    "cursor-pointer whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
                    isNumericType(col.type) && "text-right"
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.name}
                    {sortCol === col.name && (
                      <span className="text-[var(--color-brand)]">
                        {sortAsc ? "↑" : "↓"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, i) => (
              <tr
                key={i}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                {meta.map((col) => (
                  <td
                    key={col.name}
                    className={clsx(
                      "whitespace-nowrap px-3 py-2 font-mono text-xs",
                      isNumericType(col.type) && "text-right"
                    )}
                    title={String(row[col.name] ?? "")}
                  >
                    {formatCell(row[col.name], col.name, col.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibleRows < data.length && (
        <button
          onClick={() => setVisibleRows((v) => v + PAGE_SIZE)}
          className="text-sm font-medium text-[var(--color-brand)] hover:underline"
        >
          Show more ({data.length - visibleRows} remaining)
        </button>
      )}
    </div>
  );
}
