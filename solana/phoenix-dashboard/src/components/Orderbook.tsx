import { useMemo } from "react";
import { usePhoenix } from "../ws/PhoenixWebSocket";
import { fmtPrice, fmtSize } from "../utils/format";
import type { OrderbookLevel } from "../types";

const LEVELS = 12;
const WALL_MULTIPLIER = 3;
const DEPTH_BANDS_BPS = [10, 25, 50] as const;

interface Row {
  price: number;
  size: number;
  cumSize: number;
  depthPct: number;
  isWall: boolean;
}

function buildRows(levels: OrderbookLevel[]): Row[] {
  const slice = levels.slice(0, LEVELS);
  let cum = 0;
  const partial = slice.map((lvl) => {
    cum += lvl.size;
    return { price: lvl.price, size: lvl.size, cumSize: cum, depthPct: 0 };
  });
  const maxCum = partial[partial.length - 1]?.cumSize ?? 0;
  const sortedSizes = [...partial.map((r) => r.size)].sort((a, b) => a - b);
  const median = sortedSizes.length ? sortedSizes[Math.floor(sortedSizes.length / 2)] : 0;
  const wallThreshold = median * WALL_MULTIPLIER;
  return partial.map((r) => ({
    ...r,
    depthPct: maxCum > 0 ? (r.cumSize / maxCum) * 100 : 0,
    isWall: median > 0 && r.size > wallThreshold,
  }));
}

function sumDepthWithinBps(
  levels: OrderbookLevel[],
  mid: number | null,
  bps: number,
  side: "ask" | "bid",
): number {
  if (mid == null || mid <= 0) return 0;
  const limit = side === "ask" ? mid * (1 + bps / 10_000) : mid * (1 - bps / 10_000);
  let total = 0;
  for (const lvl of levels) {
    if (side === "ask" && lvl.price > limit) break;
    if (side === "bid" && lvl.price < limit) break;
    total += lvl.size;
  }
  return total;
}

export function Orderbook() {
  const { orderbook } = usePhoenix();

  const askRowsTopDown = useMemo(() => buildRows(orderbook.asks).reverse(), [orderbook.asks]);
  const bidRows = useMemo(() => buildRows(orderbook.bids), [orderbook.bids]);

  const bestBid = orderbook.bids[0]?.price ?? null;
  const bestAsk = orderbook.asks[0]?.price ?? null;
  const mid = bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null;
  const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null;
  const spreadBps = spread != null && mid != null && mid !== 0 ? (spread / mid) * 10_000 : null;

  // Resting-pressure imbalance from the top-12 levels.
  const top12BidSize = bidRows.reduce((s, r) => s + r.size, 0);
  const top12AskSize = askRowsTopDown.reduce((s, r) => s + r.size, 0);
  const totalSize = top12BidSize + top12AskSize;
  const bidPct = totalSize > 0 ? (top12BidSize / totalSize) * 100 : 50;
  const askPct = 100 - bidPct;

  // Depth bands within X bps of the mid.
  const depthRows = DEPTH_BANDS_BPS.map((bps) => ({
    bps,
    ask: sumDepthWithinBps(orderbook.asks, mid, bps, "ask"),
    bid: sumDepthWithinBps(orderbook.bids, mid, bps, "bid"),
  }));

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="qn-eyebrow">Order Book</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost">
          {orderbook.bids.length + orderbook.asks.length} lvls
        </span>
      </div>

      <DepthStrip rows={depthRows} hasMid={mid != null} />

      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 font-mono uppercase text-[10px] tracking-wide text-fg-ghost border-b border-border">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      <div className="text-xs">
        {askRowsTopDown.map((r) => (
          <BookRow key={`a-${r.price}`} row={r} side="ask" />
        ))}

        <ImbalanceBar bidPct={bidPct} askPct={askPct} />

        <div className="border-y border-border bg-bg-elev px-3 py-1.5 flex items-baseline justify-between">
          <span className="font-mono text-fg tabular-nums text-sm">
            {mid != null ? fmtPrice(mid, 3) : "—"}
          </span>
          <span className="font-mono uppercase text-[10px] text-fg-ghost tabular-nums tracking-wide">
            spread {spread != null ? `${fmtPrice(spread, 3)} · ${spreadBps?.toFixed(1)} bps` : "—"}
          </span>
        </div>

        {bidRows.map((r) => (
          <BookRow key={`b-${r.price}`} row={r} side="bid" />
        ))}
      </div>
    </div>
  );
}

function DepthStrip({
  rows,
  hasMid,
}: {
  rows: { bps: number; ask: number; bid: number }[];
  hasMid: boolean;
}) {
  return (
    <div className="border-b border-border px-3 py-2 grid grid-cols-[auto_1fr_1fr_1fr] gap-x-3 gap-y-1 items-center">
      <span className="qn-eyebrow row-start-1 row-end-4 self-start pt-0.5">Depth</span>
      {rows.map((r) => (
        <span
          key={`hdr-${r.bps}`}
          className="font-mono uppercase text-[10px] tracking-wider text-fg-ghost text-right tabular-nums"
        >
          ±{r.bps} bps
        </span>
      ))}
      {rows.map((r) => (
        <span
          key={`ask-${r.bps}`}
          className="font-mono tabular-nums text-[11px] text-bear text-right"
        >
          {hasMid ? fmtSize(r.ask, 1) : "—"}
        </span>
      ))}
      {rows.map((r) => (
        <span
          key={`bid-${r.bps}`}
          className="font-mono tabular-nums text-[11px] text-bull text-right"
        >
          {hasMid ? fmtSize(r.bid, 1) : "—"}
        </span>
      ))}
    </div>
  );
}

function ImbalanceBar({ bidPct, askPct }: { bidPct: number; askPct: number }) {
  const dominant = bidPct >= askPct ? "BID" : "ASK";
  const dominantPct = Math.max(bidPct, askPct);
  return (
    <div className="px-3 py-1.5 border-t border-border-subtle flex items-center gap-3">
      <span className="font-mono uppercase text-[10px] tracking-wider text-fg-ghost shrink-0">
        Imbalance
      </span>
      <div className="flex-1 h-2 flex bg-bg-elev border border-border overflow-hidden">
        <div
          className="h-full"
          style={{ width: `${bidPct}%`, background: "rgba(110, 198, 146, 0.85)" }}
        />
        <div
          className="h-full"
          style={{ width: `${askPct}%`, background: "rgba(233, 120, 126, 0.85)" }}
        />
      </div>
      <span
        className={`font-mono tabular-nums text-[11px] shrink-0 ${
          dominant === "BID" ? "text-bull" : "text-bear"
        }`}
      >
        {dominantPct.toFixed(0)}% {dominant}
      </span>
    </div>
  );
}

function BookRow({ row, side }: { row: Row; side: "ask" | "bid" }) {
  const priceCls = side === "ask" ? "text-bear" : "text-bull";
  const fillRgba =
    side === "ask" ? "rgba(233, 120, 126, 0.10)" : "rgba(110, 198, 146, 0.10)";
  return (
    <div
      className="relative grid grid-cols-3 gap-2 px-3 py-0.5 font-mono tabular-nums"
      title={row.isWall ? "Wall — >3× the median resting size on this side" : undefined}
    >
      <span
        className="absolute inset-y-0 right-0"
        style={{ width: `${row.depthPct}%`, background: fillRgba }}
      />
      {row.isWall && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-2/3"
          style={{ background: "var(--accent)" }}
        />
      )}
      <span className={`relative ${priceCls} ${row.isWall ? "font-semibold" : ""}`}>
        {fmtPrice(row.price, 3)}
      </span>
      <span className={`relative text-right ${row.isWall ? "text-fg font-semibold" : "text-fg"}`}>
        {fmtSize(row.size, 2)}
      </span>
      <span className="relative text-right text-fg-dim">{fmtSize(row.cumSize, 2)}</span>
    </div>
  );
}
