"use client";

import Link from "next/link";
import { QUERIES } from "@/data/queries";
import QueryRunner from "@/components/query/QueryRunner";

const query = QUERIES.find((q) => q.useCaseSlug === "validator-rewards")!;

export default function ValidatorRewardsPage() {
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

      <QueryRunner query={query} defaultOpen />

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
