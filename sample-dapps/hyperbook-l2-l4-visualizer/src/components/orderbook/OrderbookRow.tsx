"use client";

import { memo, useEffect, useRef } from "react";
import { formatPrice, formatSize } from "@/lib/utils";

interface OrderbookRowProps {
  px: string;
  sz: string;
  szFloat: number;
  n: number;
  maxSize: number;
  side: "bid" | "ask";
  coin: string;
  prevSz?: string;
}

export const OrderbookRow = memo(function OrderbookRow({
  px,
  sz,
  szFloat,
  n,
  maxSize,
  side,
  coin,
  prevSz,
}: OrderbookRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isBid = side === "bid";
  const barPercent = maxSize > 0 ? Math.min((szFloat / maxSize) * 100, 100) : 0;

  useEffect(() => {
    if (prevSz !== undefined && prevSz !== sz && rowRef.current) {
      const el = rowRef.current;
      el.classList.remove("flash-bid", "flash-ask");
      void el.offsetWidth;
      el.classList.add(isBid ? "flash-bid" : "flash-ask");
    }
  }, [sz, prevSz, isBid]);

  return (
    <div
      ref={rowRef}
      className="relative h-[26px] hover:bg-[var(--bg-card-hover)] transition-colors duration-100"
    >
      {/* Depth bar */}
      <div
        className={`absolute top-0 bottom-0 depth-bar ${isBid ? "left-0" : "right-0"}`}
        style={{
          width: `${barPercent}%`,
          background: isBid ? "var(--bid-bar)" : "var(--ask-bar)",
        }}
      />

      {/* Row data */}
      <div className="relative ob-row h-full text-[11px] font-mono leading-none">
        <span className={`tabular-nums ${isBid ? "text-[var(--bid)]" : "text-[var(--ask)]"}`}>
          {formatPrice(px, coin)}
        </span>
        <span className="text-right tabular-nums text-[var(--text-primary)]">
          {formatSize(sz)}
        </span>
        <span className="text-right tabular-nums text-[var(--text-muted)]">
          {n}
        </span>
      </div>
    </div>
  );
});
