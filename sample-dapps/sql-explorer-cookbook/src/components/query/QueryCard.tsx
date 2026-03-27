"use client";

import clsx from "clsx";
import type { PrebuiltQuery } from "@/types";
import QueryRunner from "./QueryRunner";

interface QueryCardProps {
  query: PrebuiltQuery;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function QueryCard({
  query,
  isExpanded,
  onToggle,
}: QueryCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border transition-all",
        isExpanded
          ? "border-[var(--color-brand)] shadow-md"
          : "border-[var(--color-border)] hover:border-[var(--color-border-secondary)]"
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
              {query.category}
            </span>
            {query.parameterizable && (
              <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                Parameterized
              </span>
            )}
          </div>
          <h3 className="mt-2 font-medium">{query.title}</h3>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)] line-clamp-1">
            {query.description}
          </p>
        </div>
        <svg
          className={clsx(
            "mt-1 h-5 w-5 shrink-0 text-[var(--color-text-tertiary)] transition-transform",
            isExpanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--color-border)] p-4">
          <QueryRunner query={query} />
        </div>
      )}
    </div>
  );
}
