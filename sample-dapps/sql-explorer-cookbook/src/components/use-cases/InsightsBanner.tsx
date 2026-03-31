interface InsightsBannerProps {
  insights: string[];
}

export default function InsightsBanner({ insights }: InsightsBannerProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
      <p className="mb-3 text-xs font-mono uppercase tracking-widest text-[var(--color-text-tertiary)]">
        What to look for
      </p>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
