"use client";

import { useMemo } from "react";
import { OrderbookRow } from "./OrderbookRow";
import { SpreadDisplay } from "./SpreadDisplay";
import type { L2BookState } from "@/types/orderbook";
import { useOrderbook } from "@/hooks/useOrderbook";

interface OrderbookLadderProps {
  data: L2BookState | null;
  prevData: L2BookState | null;
  coin: string;
}

export function OrderbookLadder({ data, prevData, coin }: OrderbookLadderProps) {
  const { spread, spreadBps, midPrice, maxSize, bidsEnriched, asksEnriched } =
    useOrderbook(data);

  const prevBidMap = useMemo(() => {
    const map = new Map<string, string>();
    prevData?.bids.forEach((l) => map.set(l.px, l.sz));
    return map;
  }, [prevData]);

  const prevAskMap = useMemo(() => {
    const map = new Map<string, string>();
    prevData?.asks.forEach((l) => map.set(l.px, l.sz));
    return map;
  }, [prevData]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-[12px]">
        Waiting for data...
      </div>
    );
  }

  const reversedAsks = [...asksEnriched].reverse();

  return (
    <div className="flex flex-col h-full">
      {/* Column headers */}
      <div className="ob-row h-8 shrink-0 text-[10px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Cnt</span>
      </div>

      {/* Asks (anchored to bottom, best ask next to spread) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-end">
        <div className="overflow-hidden">
          {reversedAsks.map((level) => (
            <OrderbookRow
              key={`a-${level.px}`}
              px={level.px}
              sz={level.sz}
              szFloat={level.szFloat}
              n={level.n}
              maxSize={maxSize}
              side="ask"
              coin={coin}
              prevSz={prevAskMap.get(level.px)}
            />
          ))}
        </div>
      </div>

      {/* Spread */}
      <SpreadDisplay spread={spread} spreadBps={spreadBps} midPrice={midPrice} coin={coin} />

      {/* Bids */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {bidsEnriched.map((level) => (
          <OrderbookRow
            key={`b-${level.px}`}
            px={level.px}
            sz={level.sz}
            szFloat={level.szFloat}
            n={level.n}
            maxSize={maxSize}
            side="bid"
            coin={coin}
            prevSz={prevBidMap.get(level.px)}
          />
        ))}
      </div>
    </div>
  );
}
