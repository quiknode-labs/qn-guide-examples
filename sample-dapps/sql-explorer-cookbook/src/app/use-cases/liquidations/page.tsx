"use client";

import { useState } from "react";
import Link from "next/link";
import { QUERIES } from "@/data/queries";
import type { SQLExplorerResponse } from "@/types";
import QueryRunner from "@/components/query/QueryRunner";
import InsightsBanner from "@/components/use-cases/InsightsBanner";
import StatHighlights, {
  type StatConfig,
} from "@/components/use-cases/StatHighlights";
import { formatNumber, formatUsd } from "@/lib/format";

const query = QUERIES.find((q) => q.useCaseSlug === "liquidations")!;

const insights = [
  "Monitor which assets are seeing the most liquidation activity in the last 24 hours",
  "Compare mark price vs. execution price to understand slippage during liquidations",
  "Spot liquidation clusters — many liquidations in a short window can signal cascading risk",
];

const stats: StatConfig[] = [
  {
    label: "Liquidations",
    extract: (d) => formatNumber(d.data.length),
  },
  {
    label: "Total Notional",
    extract: (d) => {
      const sum = d.data.reduce(
        (acc, row) => acc + Number(row.notional ?? 0),
        0,
      );
      return formatUsd(sum);
    },
  },
  {
    label: "Coins Affected",
    extract: (d) => {
      const coins = new Set(d.data.map((row) => row.coin));
      return formatNumber(coins.size);
    },
  },
  {
    label: "Largest Liquidation",
    extract: (d) => {
      const max = Math.max(...d.data.map((row) => Number(row.notional ?? 0)));
      return formatUsd(max);
    },
  },
];

export default function LiquidationsPage() {
  const [results, setResults] = useState<SQLExplorerResponse | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          &larr; Back to Home
        </Link>
        <h1 className="mt-3 text-3xl font-bold">{query.title}</h1>
        <p className="mt-1 font-mono text-xs text-[var(--color-text-tertiary)]">
          // Example implementation
        </p>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {query.description}
        </p>
      </div>

      <InsightsBanner insights={insights} />

      {results && <StatHighlights data={results} stats={stats} />}

      <QueryRunner query={query} defaultOpen onData={setResults} />

      <div className="border-t border-[var(--color-border)] pt-6 text-center">
        <Link
          href="/explorer"
          className="text-sm font-medium text-[var(--color-brand)] hover:underline"
        >
          Browse more example queries &rarr;
        </Link>
      </div>
    </div>
  );
}
