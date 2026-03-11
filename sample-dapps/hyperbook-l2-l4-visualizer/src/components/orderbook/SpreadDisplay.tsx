"use client";

import { NumberTransition } from "@/components/ui/NumberTransition";

interface SpreadDisplayProps {
  spread: number;
  spreadBps: number;
  midPrice: number;
  coin: string;
}

export function SpreadDisplay({ spread, spreadBps, midPrice }: SpreadDisplayProps) {
  if (midPrice === 0) return null;

  return (
    <div className="flex items-center justify-center gap-3 h-8 shrink-0 border-y border-[var(--border)] liquid-glass-subtle">
      <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">Spread</span>
      <NumberTransition
        value={spread}
        format={(n) => `$${n.toFixed(2)}`}
        className="text-[11px] font-mono text-[var(--text-secondary)] tabular-nums"
      />
      <NumberTransition
        value={spreadBps}
        format={(n) => `${n.toFixed(1)} bps`}
        className="text-[10px] font-mono text-[var(--text-muted)] tabular-nums"
      />
    </div>
  );
}
