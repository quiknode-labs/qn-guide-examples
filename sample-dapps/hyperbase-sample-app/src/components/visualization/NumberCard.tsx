"use client";

import type { QueryResult } from "@/lib/types";
import { formatBigNumber } from "./chart-utils";

interface NumberCardProps {
  result: QueryResult;
}

export default function NumberCard({ result }: NumberCardProps) {
  const { columns, rows } = result;
  if (!rows.length || !columns.length) return null;

  const value = rows[0][0];
  const formatted = formatBigNumber(value, columns[0]);

  // If there's a second numeric column, show trend / % change
  const hasTrend = columns.length >= 2 && !isNaN(Number(rows[0][1]));
  let change = 0;
  let isPositive = true;

  if (hasTrend) {
    const current = Number(rows[0][0]);
    const previous = Number(rows[0][1]);
    if (previous !== 0) {
      change = ((current - previous) / Math.abs(previous)) * 100;
      isPositive = change >= 0;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-3 gap-1">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-display font-mono leading-none" style={{ color: "var(--foreground)" }}>
        {formatted}
      </div>
      <div className="text-[11px] text-foreground-light font-mono uppercase tracking-wider mt-1">
        {columns[0].replace(/_/g, " ")}
      </div>
      {hasTrend && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-mono font-semibold ${isPositive ? "text-qn-green" : "text-qn-red"}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ transform: isPositive ? "none" : "rotate(180deg)" }}>
            <path d="M5 1L9 6H1L5 1Z" />
          </svg>
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
