import type { SQLExplorerResponse } from "@/types";

export interface StatConfig {
  label: string;
  extract: (data: SQLExplorerResponse) => string;
}

interface StatHighlightsProps {
  data: SQLExplorerResponse;
  stats: StatConfig[];
}

export default function StatHighlights({ data, stats }: StatHighlightsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-text-tertiary)]">
            {stat.label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {stat.extract(data)}
          </p>
        </div>
      ))}
    </div>
  );
}
