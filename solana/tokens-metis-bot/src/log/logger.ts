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

// Console lines carry no timestamp; the ndjson trade log keeps its `ts` for
// the audit trail. Info lines are bare; warn and error keep a label.
function line(message: string, fields?: Record<string, unknown>): string {
  return fields && Object.keys(fields).length > 0 ? `${message} ${JSON.stringify(fields)}` : message;
}

export function createLogger(tradeLogPath = join("logs", "trades.ndjson")): Logger {
  return {
    info(message, fields) {
      console.log(line(message, fields));
    },
    warn(message, fields) {
      console.warn(line(`WARN: ${message}`, fields));
    },
    error(message, fields) {
      console.error(line(`ERROR: ${message}`, fields));
    },
    trade(entry) {
      mkdirSync(dirname(tradeLogPath), { recursive: true });
      appendFileSync(tradeLogPath, JSON.stringify(entry) + "\n", "utf8");
      // Console: TICKER: ACTION - reason. Full detail lives in the ndjson log.
      const marker = entry.dryRun ? " (dry run)" : "";
      console.log(`${entry.symbol}: ${entry.action.toUpperCase()}${marker} - ${entry.reason}`);
    },
  };
}
