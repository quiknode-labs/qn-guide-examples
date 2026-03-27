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

const query = QUERIES.find((q) => q.useCaseSlug === "validator-rewards")!;

const insights = [
  "See how pending rewards are distributed across the validators you delegate to",
  "Compare commission rates between validators to optimize your staking strategy",
  "Identify which validators yield the highest returns for your delegation",
];

const stats: StatConfig[] = [
  {
    label: "Validators",
    extract: (d) => formatNumber(d.data.length),
  },
  {
    label: "Total Reward",
    extract: (d) => {
      const sum = d.data.reduce((acc, row) => acc + Number(row.reward ?? 0), 0);
      return formatUsd(sum);
    },
  },
  {
    label: "Highest Reward",
    extract: (d) => {
      const max = Math.max(...d.data.map((row) => Number(row.reward ?? 0)));
      return formatUsd(max);
    },
  },
  {
    label: "Avg Commission",
    extract: (d) => {
      const vals = d.data.map((row) => Number(row.commission_bps ?? 0));
      const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      return `${(avg / 100).toFixed(1)}%`;
    },
  },
];

export default function ValidatorRewardsPage() {
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
