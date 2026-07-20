// Structured console logging plus an append-only NDJSON trade log. The
// trade log is the audit trail: one line per executed (or dry-run) trade.

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export interface TradeLogEntry {
  ts: string; // ISO timestamp
  action: "buy" | "sell";
  dryRun: boolean;
  assetId: string;
  symbol: string;
  mint: string;
  venue: string;
  dexes: string[];
  quotedOutAmount: string;
  actualOutAmount: string | null; // null on dry run
  slippageBps: number;
  priceImpactPct: string;
  liquidityTier: string;
  riskFlagCount: number;
  momentumPct: number;
  momentumBasis: string;
  reason: string;
  signature: string | null; // null on dry run
  reliableAmms: string[];
}

export interface Logger {
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
  trade(entry: TradeLogEntry): void;
}

function line(level: string, message: string, fields?: Record<string, unknown>): string {
  const base = `${new Date().toISOString()} ${level.toUpperCase()} ${message}`;
  return fields && Object.keys(fields).length > 0 ? `${base} ${JSON.stringify(fields)}` : base;
}

export function createLogger(tradeLogPath = join("logs", "trades.ndjson")): Logger {
  return {
    info(message, fields) {
      console.log(line("info", message, fields));
    },
    warn(message, fields) {
      console.warn(line("warn", message, fields));
    },
    error(message, fields) {
      console.error(line("error", message, fields));
    },
    trade(entry) {
      mkdirSync(dirname(tradeLogPath), { recursive: true });
      appendFileSync(tradeLogPath, JSON.stringify(entry) + "\n", "utf8");
      console.log(
        line("trade", `${entry.dryRun ? "[DRY RUN] " : ""}${entry.action} ${entry.symbol}`, {
          venue: entry.venue,
          out: entry.quotedOutAmount,
          reason: entry.reason,
        }),
      );
    },
  };
}
