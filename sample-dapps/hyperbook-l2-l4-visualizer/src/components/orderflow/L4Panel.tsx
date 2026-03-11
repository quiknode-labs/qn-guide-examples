"use client";

import { OrderFlowFeed } from "./OrderFlowFeed";
import { SnapshotSummary } from "./SnapshotSummary";
import type { L4DiffEvent, L4SnapshotInfo } from "@/types/orderflow";
import type { StreamStatus } from "@/types/stream";

interface L4PanelProps {
  events: L4DiffEvent[];
  snapshotInfo: L4SnapshotInfo | null;
  coin: string;
  status: StreamStatus;
  className?: string;
}

export function L4Panel({ events, snapshotInfo, coin, status, className = "" }: L4PanelProps) {
  return (
    <div className={`liquid-glass liquid-glass-glow flex flex-col ${className}`}>
      {/* Panel header */}
      <div className="flex items-center justify-center h-11 px-4 shrink-0 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-semibold tracking-wide text-[var(--text-primary)]">
            ORDER FLOW
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">L4</span>
          <span className="text-[11px] font-mono text-[var(--accent)]">{coin}</span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            / {events.length} events
          </span>
        </div>
      </div>

      {/* Snapshot */}
      {snapshotInfo && <SnapshotSummary snapshot={snapshotInfo} />}

      {/* Column headers */}
      <div className="of-row shrink-0 h-7 text-[10px] uppercase tracking-wider font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
        <span />
        <span>Type</span>
        <span>Side</span>
        <span className="text-right">Price</span>
        <span className="text-right">Size</span>
        <span className="truncate pl-2 text-right">Wallet</span>
      </div>

      {/* Feed */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <OrderFlowFeed events={events} status={status} />
      </div>
    </div>
  );
}
