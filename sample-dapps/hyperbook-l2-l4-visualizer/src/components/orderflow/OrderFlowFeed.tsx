"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { OrderFlowRow } from "./OrderFlowRow";
import type { L4DiffEvent } from "@/types/orderflow";
import type { StreamStatus } from "@/types/stream";

interface OrderFlowFeedProps {
  events: L4DiffEvent[];
  status: StreamStatus;
}

export function OrderFlowFeed({ events, status }: OrderFlowFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 20,
  });

  if (events.length === 0) {
    const msg =
      status === "connecting"
        ? "Connecting to L4 stream..."
        : status === "connected"
          ? "Waiting for order activity..."
          : status === "reconnecting"
            ? "Reconnecting..."
            : status === "error"
              ? "Connection error"
              : "Disconnected";

    return (
      <div className="flex flex-col items-center justify-center h-full gap-1.5">
        <span className="text-[var(--text-muted)] text-[12px]">{msg}</span>
        {status === "connected" && (
          <span className="text-[var(--text-muted)] text-[11px]">
            Try BTC, ETH, or DOGE for active markets
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const event = events[virtualRow.index];
          return (
            <div
              key={event.id}
              className="absolute top-0 left-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <OrderFlowRow event={event} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
