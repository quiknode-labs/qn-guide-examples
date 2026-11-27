// Plain-language readings of the live data: verdicts for table cells, and the short notes a
// panel shows when it has no data yet or is still learning a baseline.
import type { SignalRow, Snapshot, WindowKey } from "../../shared/types.ts";
import { span } from "./format.ts";

/** A gap inside this band counts as "priced in line with the stock". */
export const FAIR_BAND_PCT = 0.5;
/** A z-score at or past this is unusual for the ticker. */
export const UNUSUAL_Z = 2;
/** Trading this many times the usual pace counts as a spike. */
export const SPIKE_X = 2;

export const WINDOW_PHRASE: Record<WindowKey, string> = {
  "15m": "in the last 15 minutes",
  "1h": "in the last hour",
  all: "since the app started",
};

const abs2 = (value: number) => `${Math.abs(value).toFixed(2)}%`;

/** "0.42% above" or "0.10% below". */
export function gapWords(premiumPct: number): string {
  return `${abs2(premiumPct)} ${premiumPct >= 0 ? "above" : "below"}`;
}

export interface Reading { label: string; detail: string; flag: boolean }

/** Is this ticker's gap normal for it? */
export function normalReading(row: SignalRow): Reading {
  if (row.stale) return { label: "No fresh stock price", detail: "The stock price is over 5 minutes old, so the gap can't be judged.", flag: false };
  if (row.premiumPct === null) return { label: "No recent trade", detail: "No trade with a clear price in the last 15 minutes, so there is no current gap to judge.", flag: false };
  if (row.z === null) return { label: "Still learning", detail: "Needs about 5 minutes of prices to know what is normal for this ticker.", flag: false };
  const side = row.z >= 0 ? "high" : "low";
  const detail = `${Math.abs(row.z).toFixed(1)} standard deviations ${row.z >= 0 ? "above" : "below"} this ticker's average gap since the app started.`;
  if (Math.abs(row.z) >= UNUSUAL_Z) return { label: `Unusually ${side}`, detail, flag: true };
  if (Math.abs(row.z) >= 1) return { label: `A little ${side}`, detail, flag: false };
  return { label: "Typical", detail, flag: false };
}

/** Is this ticker trading more than usual? */
export function paceReading(row: SignalRow): Reading {
  if (row.spike === null) return { label: "Still learning", detail: "Needs 30 minutes of trading to know the usual pace.", flag: false };
  const detail = `Dollar volume in the last 5 minutes against the average 5 minutes since the app started.`;
  if (row.spike >= SPIKE_X) return { label: `${row.spike.toFixed(1)}x usual`, detail, flag: true };
  if (row.spike <= 0.5) return { label: "Quiet", detail, flag: false };
  return { label: "Usual pace", detail, flag: false };
}

/** Seconds of fresh prices a ticker needs before the app can say what gap is normal for it. */
const BASELINE_NEEDED_SEC = 5 * 60;

/** While any ticker is still building its baseline, say so with the time left. Otherwise nothing. */
export function learningNote(signals: SignalRow[]): string | null {
  const learning = signals.filter((row) => row.z === null && !row.stale && row.premiumPct !== null);
  if (learning.length === 0) return null;
  const left = Math.max(...learning.map((row) => BASELINE_NEEDED_SEC - row.baselineSec));
  const what = learning.length === signals.length ? "each ticker" : `${learning.length} of these tickers`;
  return `Learning what gap is normal for ${what}. About ${span(Math.max(15, left))} left.`;
}

/** The quote for one size, if Jupiter found a route. */
export function quoteAt(row: SignalRow, sizeUsd: number) {
  return row.slippage?.find((s) => s.usd === sizeUsd) ?? null;
}

/** Volume spikes need 30 minutes of trading history. Until then, say how long is left. */
const PACE_NEEDED_SEC = 30 * 60;

export function paceLearningNote(snapshot: Snapshot): string | null {
  if (snapshot.signals.length > 0 && snapshot.signals.every((row) => row.spike !== null)) return null;
  const left = PACE_NEEDED_SEC - (snapshot.now - snapshot.status.startedAt) / 1000;
  if (left <= 0) return null;
  return `Learning the usual trading pace. About ${span(Math.max(15, left))} left.`;
}

export function emptyFlowsNote(snapshot: Snapshot): string | null {
  const total = Object.values(snapshot.flows).reduce((sum, value) => sum + value, 0);
  return total > 0 ? null : `No tokens have moved ${WINDOW_PHRASE[snapshot.window.key]}.`;
}

export function emptyMintNote(snapshot: Snapshot): string | null {
  return snapshot.netMint.length > 0 ? null : `No tokens were minted or redeemed ${WINDOW_PHRASE[snapshot.window.key]}.`;
}

/** Text for the alerts panel when nothing is listed: why, and when that can change. */
export function opportunityNote(snapshot: Snapshot): string | null {
  if (snapshot.opportunities.length > 0) return null;
  if (!snapshot.status.marketOpen) return "Markets are closed.";
  const learning = learningNote(snapshot.signals);
  if (learning) return `No tickers fit yet. ${learning}`;
  return "No tickers fit right now.";
}
