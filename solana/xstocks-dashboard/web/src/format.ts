import type { EventType } from "../../shared/types.ts";

export function usd(value: number | null | undefined, compact = true): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (compact && abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (compact && abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (compact && abs >= 1e4) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function signedUsd(value: number): string {
  // Never print "-$0.00": anything under half a cent is zero.
  if (Math.abs(value) < 0.005) return "$0.00";
  return `${value > 0 ? "+" : ""}${usd(value)}`;
}

export function price(value: number | null | undefined): string {
  if (value === null || value === undefined) return "n/a";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function shares(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e4) return `${(value / 1e3).toFixed(1)}K`;
  if (abs >= 100) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function pct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function clock(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", { hour12: false });
}

/** Time of day, with the date in front when it is not the same day as `now`. */
export function stamp(ms: number, now: number): string {
  const sameDay = new Date(ms).toDateString() === new Date(now).toDateString();
  return sameDay ? clock(ms) : `${new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${clock(ms)}`;
}

export function shortClock(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

export function duration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function span(seconds: number): string {
  if (seconds < 90) return `${Math.round(seconds)}s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

export const short = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;
export const txUrl = (signature: string) => `https://explorer.solana.com/tx/${signature}`;
export const addressUrl = (address: string) => `https://explorer.solana.com/address/${address}`;

/** Chart tokens in canonical order, 1 to 12. */
export const chartColor = (index: number) => `var(--color-chart-${Math.min(12, Math.max(1, index + 1))})`;

/** Event types take chart tokens in a fixed order, shared by the tape and the flows panel. */
export const EVENT_META: Record<EventType, { label: string; color: string }> = {
  buy: { label: "BUY", color: chartColor(0) },
  sell: { label: "SELL", color: chartColor(1) },
  transfer: { label: "XFER", color: chartColor(2) },
  mint: { label: "MINT", color: chartColor(3) },
  redeem: { label: "REDEEM", color: chartColor(4) },
  lend_deposit: { label: "LEND IN", color: chartColor(5) },
  lend_withdraw: { label: "LEND OUT", color: chartColor(5) },
  lp_add: { label: "LP ADD", color: chartColor(6) },
  lp_remove: { label: "LP OUT", color: chartColor(6) },
};
