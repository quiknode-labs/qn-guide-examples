"use client";

import { memo } from "react";
import { formatPrice, formatSize, truncateAddress } from "@/lib/utils";
import { DiffType, type L4DiffEvent } from "@/types/orderflow";
import { getWhaleThreshold } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";

interface OrderFlowRowProps {
  event: L4DiffEvent;
}

const TYPE_LABELS: Record<DiffType, string> = {
  [DiffType.NEW]: "NEW",
  [DiffType.UPDATED]: "UPD",
  [DiffType.REMOVED]: "RMV",
  [DiffType.FILLED]: "FILL",
  [DiffType.CANCELED]: "CXL",
};

const TYPE_BADGE_VARIANT: Record<DiffType, "new" | "updated" | "removed" | "filled" | "canceled"> = {
  [DiffType.NEW]: "new",
  [DiffType.UPDATED]: "updated",
  [DiffType.REMOVED]: "removed",
  [DiffType.FILLED]: "filled",
  [DiffType.CANCELED]: "canceled",
};

const DOT_COLORS: Record<DiffType, string> = {
  [DiffType.NEW]: "bg-[var(--bid)]",
  [DiffType.UPDATED]: "bg-[var(--warn)]",
  [DiffType.REMOVED]: "bg-[var(--ask)]",
  [DiffType.FILLED]: "bg-[var(--purple)]",
  [DiffType.CANCELED]: "bg-[var(--text-muted)]",
};

export const OrderFlowRow = memo(function OrderFlowRow({ event }: OrderFlowRowProps) {
  const sz = parseFloat(event.sz);
  const isWhale = !isNaN(sz) && sz >= getWhaleThreshold(event.coin);
  const isSell = event.side !== "Buy";

  const flashClass = isWhale ? "whale-glow" : isSell ? "flash-ask" : "flash-bid";

  return (
    <div
      className={`of-row h-[28px] text-[11px] font-mono border-b border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] transition-colors duration-100 ${flashClass}`}
    >
      {/* Dot */}
      <div className={`w-[5px] h-[5px] rounded-full ${DOT_COLORS[event.type]}`} />

      {/* Type */}
      <Badge variant={TYPE_BADGE_VARIANT[event.type]}>
        {TYPE_LABELS[event.type]}
      </Badge>

      {/* Side */}
      <Badge variant={isSell ? "sell" : "buy"}>
        {isSell ? "SELL" : "BUY"}
      </Badge>

      {/* Price */}
      <span className={`text-right tabular-nums ${isSell ? "text-[var(--ask)]" : "text-[var(--bid)]"}`}>
        {formatPrice(event.px, event.coin)}
      </span>

      {/* Size */}
      <span className="text-right tabular-nums text-[var(--text-primary)]">
        {event.type === DiffType.UPDATED && event.origSz && event.newSz ? (
          <>
            <span className="text-[var(--text-muted)]">{formatSize(event.origSz)}</span>
            <span className="text-[var(--text-muted)] mx-0.5">&rarr;</span>
            {formatSize(event.newSz)}
          </>
        ) : (
          formatSize(event.sz)
        )}
      </span>

      {/* Wallet */}
      <span className="text-[var(--text-muted)] truncate text-[10px] pl-2 text-right">
        {event.user ? truncateAddress(event.user) : ""}
      </span>
    </div>
  );
});
