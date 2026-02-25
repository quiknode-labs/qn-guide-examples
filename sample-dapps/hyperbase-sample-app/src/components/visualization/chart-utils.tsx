"use client";

import type { CSSProperties } from "react";

// ── Number Formatting ─────────────────────────────────────

export function formatTooltipValue(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  if (Number.isInteger(num)) return num.toLocaleString();
  return num.toFixed(2);
}

export function formatAxisLabel(value: unknown): string {
  const str = String(value);

  // DateTime like "2026-02-12 00:00:00" → "Feb 12 14:00"
  const dtMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (dtMatch) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[parseInt(dtMatch[2]) - 1];
    const day = parseInt(dtMatch[3]);
    const hour = dtMatch[4];
    if (hour !== "00") return `${month} ${day} ${hour}:${dtMatch[5]}`;
    return `${month} ${day}`;
  }

  // Date like "2026-02-12" → "Feb 12"
  const dateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(dateMatch[2]) - 1]} ${parseInt(dateMatch[3])}`;
  }

  if (str.length > 12) return str.slice(0, 11) + "…";
  return str;
}

export function formatBigNumber(value: unknown, columnName?: string): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);

  // Don't abbreviate block numbers, heights, IDs, etc. — show full integer with commas
  if (columnName && /^(block|height|id|number|nonce|index|slot|epoch)/i.test(columnName.replace(/_/g, ""))) {
    return Number.isInteger(num) ? num.toLocaleString() : num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// ── Nivo Theme ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nivoTheme: any = {
  background: "transparent",
  text: {
    fontSize: 10,
    fill: "var(--foreground-light)",
    fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
  },
  axis: {
    ticks: {
      line: { stroke: "transparent" },
      text: {
        fontSize: 10,
        fill: "var(--foreground-light)",
        fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
      },
    },
    domain: { line: { stroke: "transparent" } },
  },
  grid: {
    line: {
      stroke: "var(--border)",
      strokeWidth: 1,
      strokeDasharray: "3 3",
    },
  },
  crosshair: {
    line: {
      stroke: "var(--foreground-light)",
      strokeWidth: 1,
      strokeOpacity: 0.25,
    },
  },
  tooltip: {
    container: {
      background: "var(--background)",
      boxShadow: "inset 0 0 0 1px var(--border), 0 4px 12px rgba(0,0,0,0.15)",
      borderRadius: "8px",
      fontSize: "11px",
      fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
      padding: "8px 12px",
    },
  },
};

// ── Tooltip Styles (for custom slice/bar tooltips) ────────

export const tt = {
  wrap: {
    background: "var(--background)",
    boxShadow: "inset 0 0 0 1px var(--border), 0 4px 12px rgba(0,0,0,0.15)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
  } as CSSProperties,
  label: {
    color: "var(--foreground-light)",
    fontSize: "10px",
    marginBottom: "4px",
  } as CSSProperties,
  row: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    lineHeight: "1.6",
  } as CSSProperties,
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  } as CSSProperties,
  name: {
    color: "var(--foreground-medium)",
    fontSize: "11px",
  } as CSSProperties,
  val: {
    color: "var(--foreground)",
    fontWeight: 600,
    fontSize: "11px",
  } as CSSProperties,
};

// ── Helpers ───────────────────────────────────────────────

/** Sort rows by x-axis and deduplicate — keeps last value per x. */
export function sortAndDedup(rows: unknown[][]): unknown[][] {
  const sorted = [...rows].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const seen = new Map<string, unknown[]>();
  for (const row of sorted) {
    seen.set(String(row[0]), row);
  }
  return Array.from(seen.values());
}

/** Compute evenly-spaced tick values from a list of x-axis strings */
export function computeTickValues(allX: string[], maxTicks = 7): string[] {
  if (allX.length <= maxTicks) return allX;
  const interval = Math.ceil(allX.length / maxTicks);
  return allX.filter((_, i) => i % interval === 0);
}

/** Extract only the numeric y-axis column names from a result set.
 *  Skips column 0 (x-axis) and any columns whose values are non-numeric strings. */
export function getNumericYKeys(columns: string[], rows: unknown[][]): string[] {
  if (columns.length < 2 || !rows.length) return [];
  return columns.slice(1).filter((_, i) => {
    const colIdx = i + 1;
    const sample = rows.slice(0, 10).map((r) => r[colIdx]).filter((v) => v !== null && v !== undefined);
    if (!sample.length) return false;
    return sample.every((v) => {
      if (typeof v === "number") return true;
      if (typeof v === "string") {
        // Reject hex addresses (0x...), UUIDs, and anything that doesn't look like a plain number
        if (/^0x/i.test(v) || /[a-df-z]/i.test(v)) return false;
        return v !== "" && !isNaN(Number(v));
      }
      return false;
    });
  });
}
