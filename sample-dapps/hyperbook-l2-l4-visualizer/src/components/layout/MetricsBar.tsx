"use client";

import { useCallback } from "react";
import { NumberTransition } from "@/components/ui/NumberTransition";
import type { Metrics } from "@/hooks/useMetrics";

interface MetricsBarProps {
  metrics: Metrics;
  coin: string;
}

function Metric({
  label,
  value,
  format,
  color,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] leading-none whitespace-nowrap">
        {label}
      </span>
      <NumberTransition
        value={value}
        format={format}
        className={`text-[13px] font-mono tabular-nums leading-none whitespace-nowrap ${color || "text-[var(--text-primary)]"}`}
        springConfig={{ stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

function Divider() {
  return <div className="w-px h-8 bg-[var(--border)] shrink-0" />;
}

export function MetricsBar({ metrics, coin }: MetricsBarProps) {
  const fmtPrice = useCallback(
    (n: number) => {
      if (n === 0) return "—";
      if (coin === "BTC" || coin === "ETH" || n >= 100)
        return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (n >= 1) return `$${n.toFixed(4)}`;
      return `$${n.toFixed(6)}`;
    },
    [coin]
  );

  const fmtSize = useCallback((n: number) => {
    if (n === 0) return "—";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(1);
  }, []);

  const fmtBps = useCallback((n: number) => `${n.toFixed(1)} bps`, []);
  const fmtRatio = useCallback((n: number) => (n === 0 ? "—" : n.toFixed(2)), []);
  const fmtImbalance = useCallback((n: number) => `${n > 0 ? "+" : ""}${(n * 100).toFixed(1)}%`, []);
  const fmtRate = useCallback((n: number) => `${n.toFixed(1)}/s`, []);
  const fmtInt = useCallback((n: number) => Math.round(n).toLocaleString(), []);

  const ratioPercent =
    metrics.bidAskRatio > 0
      ? Math.min(Math.max((metrics.bidAskRatio / (metrics.bidAskRatio + 1)) * 100, 10), 90)
      : 50;

  return (
    <div className="liquid-glass liquid-glass-glow shrink-0">
      <div className="flex items-center justify-center gap-5 h-[52px] px-5 overflow-x-auto">
        {/* Hero: Mid Price */}
        <div className="flex flex-col gap-1 shrink-0">
          <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] leading-none">
            Mid Price
          </span>
          <NumberTransition
            value={metrics.midPrice}
            format={fmtPrice}
            className="text-[17px] font-mono font-semibold tabular-nums leading-none text-[var(--text-primary)] whitespace-nowrap"
            springConfig={{ stiffness: 120, damping: 20 }}
          />
        </div>

        <Divider />

        <Metric label="Best Bid" value={metrics.bestBid} format={fmtPrice} color="text-[var(--bid)]" />
        <Metric label="Best Ask" value={metrics.bestAsk} format={fmtPrice} color="text-[var(--ask)]" />
        <Metric label="Spread" value={metrics.spreadBps} format={fmtBps} />

        <Divider />

        {/* Depth with ratio bar */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <NumberTransition
              value={metrics.totalBidDepth}
              format={fmtSize}
              className="font-mono tabular-nums text-[11px] text-[var(--bid)] whitespace-nowrap leading-none"
            />
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] leading-none">Depth</span>
            <NumberTransition
              value={metrics.totalAskDepth}
              format={fmtSize}
              className="font-mono tabular-nums text-[11px] text-[var(--ask)] whitespace-nowrap leading-none"
            />
          </div>
          <div className="w-28 h-[3px] rounded-full bg-[var(--ask-soft)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--bid)] transition-all duration-500 ease-out opacity-40"
              style={{ width: `${ratioPercent}%` }}
            />
          </div>
        </div>

        <Metric label="Ratio" value={metrics.bidAskRatio} format={fmtRatio} />
        <Metric
          label="Imbalance"
          value={metrics.bookImbalance}
          format={fmtImbalance}
          color={metrics.bookImbalance >= 0 ? "text-[var(--bid)]" : "text-[var(--ask)]"}
        />

        <Divider />

        <Metric label="Flow" value={metrics.flowRate} format={fmtRate} />
        <Metric label="New" value={metrics.newOrders} format={fmtInt} color="text-[var(--bid)]" />
        <Metric label="Filled" value={metrics.filledOrders} format={fmtInt} color="text-[var(--purple)]" />
        <Metric label="Cxl" value={metrics.canceledOrders} format={fmtInt} />
      </div>
    </div>
  );
}
