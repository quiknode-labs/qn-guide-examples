import { useMemo } from "react";
import { usePhoenix } from "../ws/PhoenixWebSocket";
import { fmtNotional, fmtPrice, fmtSize, fmtTime } from "../utils/format";
import type { TradePrint } from "../types";

const TRADE_DISPLAY_CAP = 25;

function isBuySide(t: TradePrint): boolean {
  return t.side === "buy" || t.side === "bid" || t.side === "long";
}

export function TradeFeed() {
  const { trades } = usePhoenix();

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="qn-eyebrow">Trades</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost">
          {trades.length} / {TRADE_DISPLAY_CAP}
        </span>
      </div>

      <TradeFlowStrip trades={trades} />

      <div className="grid grid-cols-[4.5rem_3.5rem_1fr_1fr_1fr] gap-2 px-3 py-1.5 font-mono uppercase text-[10px] tracking-wide text-fg-ghost border-b border-border">
        <span>Time</span>
        <span>Side</span>
        <span className="text-right">Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Notional</span>
      </div>

      <div className="text-xs">
        {trades.length === 0 ? (
          <div className="px-3 py-4 font-mono uppercase text-[10px] tracking-wide text-fg-ghost">
            // Waiting for trades
          </div>
        ) : (
          trades.map((t) => {
            const isBuy = isBuySide(t);
            const sideColor = isBuy ? "text-bull" : "text-bear";
            return (
              <div
                key={t.id}
                className="grid grid-cols-[4.5rem_3.5rem_1fr_1fr_1fr] gap-2 px-3 py-0.5 font-mono tabular-nums hover:bg-bg-hover"
              >
                <span className="text-fg-dim">{fmtTime(t.time)}</span>
                <span className={`${sideColor} uppercase`}>
                  {isBuy ? "Buy" : "Sell"}
                  {t.numFills && t.numFills > 1 ? "*" : ""}
                </span>
                <span className={`text-right ${sideColor}`}>{fmtPrice(t.price, 3)}</span>
                <span className="text-right text-fg">{fmtSize(t.size, 2)}</span>
                <span className="text-right text-fg-dim">{fmtNotional(t.notional)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TradeFlowStrip({ trades }: { trades: TradePrint[] }) {
  const analytics = useMemo(() => {
    let buyNotional = 0;
    let sellNotional = 0;
    for (const t of trades) {
      if (isBuySide(t)) buyNotional += t.notional;
      else sellNotional += t.notional;
    }
    const total = buyNotional + sellNotional;
    const buyPct = total > 0 ? (buyNotional / total) * 100 : 50;
    const sellPct = 100 - buyPct;

    const chrono = [...trades].sort((a, b) => a.time - b.time);
    const flow: number[] = [];
    let running = 0;
    for (const t of chrono) {
      running += isBuySide(t) ? t.notional : -t.notional;
      flow.push(running);
    }
    return { buyPct, sellPct, flow, net: running };
  }, [trades]);

  if (!trades.length) {
    return (
      <div className="border-b border-border px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-fg-ghost">
        // Flow · waiting for first print
      </div>
    );
  }

  const dominant = analytics.buyPct >= analytics.sellPct ? "BUY" : "SELL";
  const dominantPct = Math.max(analytics.buyPct, analytics.sellPct);
  const dominantTone = dominant === "BUY" ? "text-bull" : "text-bear";
  const netTone = analytics.net >= 0 ? "text-bull" : "text-bear";

  return (
    <div className="border-b border-border px-4 py-2.5 flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="qn-eyebrow">Flow · window</span>
        <span className={`font-mono tabular-nums text-[11px] ${dominantTone}`}>
          {dominantPct.toFixed(0)}% {dominant}
        </span>
      </div>

      <div className="h-2 flex bg-bg-elev border border-border overflow-hidden">
        <div
          className="h-full"
          style={{ width: `${analytics.buyPct}%`, background: "rgba(110, 198, 146, 0.85)" }}
        />
        <div
          className="h-full"
          style={{ width: `${analytics.sellPct}%`, background: "rgba(233, 120, 126, 0.85)" }}
        />
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost whitespace-nowrap">
          Net
        </span>
        <FlowSparkline flow={analytics.flow} />
        <span
          className={`font-mono tabular-nums text-[11px] whitespace-nowrap ${netTone}`}
        >
          {analytics.net >= 0 ? "+" : ""}
          {fmtNotional(analytics.net)}
        </span>
      </div>
    </div>
  );
}

function FlowSparkline({ flow }: { flow: number[] }) {
  if (!flow.length) return <div className="flex-1 h-6" />;
  const W = 200;
  const H = 24;
  const min = Math.min(0, ...flow);
  const max = Math.max(0, ...flow);
  const span = Math.max(max - min, 1e-9);
  const x = (i: number) => (flow.length === 1 ? W / 2 : (i / (flow.length - 1)) * W);
  const y = (v: number) => H - 1 - ((v - min) / span) * (H - 2);
  const path = flow
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(" ");
  const last = flow[flow.length - 1];
  const stroke = last >= 0 ? "#6ec692" : "#e9787e";
  const zeroY = 0 >= min && 0 <= max ? y(0) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="flex-1 h-6" preserveAspectRatio="none">
      {zeroY != null && (
        <line
          x1={0}
          x2={W}
          y1={zeroY}
          y2={zeroY}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={x(flow.length - 1)} cy={y(last)} r="1.6" fill={stroke} />
    </svg>
  );
}
