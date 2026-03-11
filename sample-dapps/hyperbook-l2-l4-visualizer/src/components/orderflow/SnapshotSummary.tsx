"use client";

import type { L4SnapshotInfo } from "@/types/orderflow";
import { formatBlockHeight } from "@/lib/utils";

interface SnapshotSummaryProps {
  snapshot: L4SnapshotInfo;
}

export function SnapshotSummary({ snapshot }: SnapshotSummaryProps) {
  return (
    <div className="flex items-center gap-3 h-7 shrink-0 text-[10px] font-mono border-b border-[var(--border)] liquid-glass-subtle" style={{ padding: "0 16px 0 24px" }}>
      <span className="text-[var(--bid)] tabular-nums">
        {snapshot.bidCount.toLocaleString()} bids
      </span>
      <span className="text-[var(--text-muted)]">/</span>
      <span className="text-[var(--ask)] tabular-nums">
        {snapshot.askCount.toLocaleString()} asks
      </span>
      <span className="text-[var(--text-muted)] ml-auto tabular-nums">
        Block {formatBlockHeight(snapshot.height)}
      </span>
    </div>
  );
}
