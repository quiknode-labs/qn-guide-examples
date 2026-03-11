"use client";

import { OrderbookLadder } from "./OrderbookLadder";
import type { L2BookState } from "@/types/orderbook";

interface L2PanelProps {
  data: L2BookState | null;
  prevData: L2BookState | null;
  coin: string;
  className?: string;
}

export function L2Panel({ data, prevData, coin, className = "" }: L2PanelProps) {
  return (
    <div className={`liquid-glass liquid-glass-glow flex flex-col ${className}`}>
      {/* Panel header */}
      <div className="flex items-center justify-center h-11 px-4 shrink-0 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-semibold tracking-wide text-[var(--text-primary)]">
            ORDERBOOK
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">L2</span>
          <span className="text-[11px] font-mono text-[var(--accent)]">{coin}</span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            / {data?.bids.length ?? 0} levels
          </span>
        </div>
      </div>

      {/* Ladder */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <OrderbookLadder data={data} prevData={prevData} coin={coin} />
      </div>
    </div>
  );
}
