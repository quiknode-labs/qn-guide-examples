"use client";

import type { QueryResult } from "@/lib/types";
import { formatTooltipValue } from "./chart-utils";

interface ResultsTableProps {
  result: QueryResult;
}

export default function ResultsTable({ result }: ResultsTableProps) {
  const { columns, rows } = result;

  if (!columns.length) {
    return <div className="text-foreground-light text-center py-8 text-sm">No results</div>;
  }

  return (
    <div className="overflow-auto max-h-[500px]">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10" style={{ background: "var(--background)" }}>
          <tr>
            {columns.map((col) => (
              <th key={col} className="th-mono text-left whitespace-nowrap border-b border-border">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="group transition-colors hover:bg-grid/50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-[13px] font-mono whitespace-nowrap border-b border-border/50">
                  {cell === null ? (
                    <span className="text-foreground-light/50 text-xs">null</span>
                  ) : typeof cell === "number" ? (
                    <span style={{ color: "var(--accent)" }}>{formatTooltipValue(cell)}</span>
                  ) : (
                    <span className="text-foreground-medium">{String(cell)}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
