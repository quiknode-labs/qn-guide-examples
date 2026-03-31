import type { QueryStatistics } from "@/types";
import { formatNumber, formatBytes, formatElapsed } from "@/lib/format";

interface QueryStatsProps {
  statistics: QueryStatistics;
  rowCount: number;
  totalRows: number;
}

export default function QueryStats({
  statistics,
  rowCount,
  totalRows,
}: QueryStatsProps) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
      <div className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span>
          {formatNumber(rowCount)} rows
          {totalRows > rowCount && (
            <span className="text-[var(--color-text-tertiary)]">
              {" "}
              of {formatNumber(totalRows)}
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>{formatNumber(statistics.rows_read)} rows read</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span>{formatBytes(statistics.bytes_read)} scanned</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{formatElapsed(statistics.elapsed)}</span>
      </div>
    </div>
  );
}
