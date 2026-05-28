import { usePhoenix } from "../ws/PhoenixWebSocket";
import { ConnectionStatus } from "./ConnectionStatus";
import { fmtNotional, fmtPct, fmtPrice, fmtUsd } from "../utils/format";
import type { MarketConfig } from "../types";

interface StatProps {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "bull" | "bear" | "muted";
}

function Stat({ label, value, sub, tone = "default" }: StatProps) {
  const toneClass =
    tone === "bull"
      ? "text-bull"
      : tone === "bear"
        ? "text-bear"
        : tone === "muted"
          ? "text-fg-muted"
          : "text-fg";
  return (
    <div className="flex flex-col gap-1 px-5 py-3 min-w-[8rem]">
      <span className="font-mono uppercase text-[10px] tracking-wider text-fg-ghost">{label}</span>
      <span className={`font-mono tabular-nums text-base ${toneClass}`}>{value}</span>
      {sub && <span className="font-mono text-[10px] text-fg-ghost tabular-nums">{sub}</span>}
    </div>
  );
}

interface Props {
  config: MarketConfig | null;
}

export function MarketOverview({ config }: Props) {
  const { stats } = usePhoenix();

  const change =
    stats.markPx != null && stats.prevDayPx != null && stats.prevDayPx !== 0
      ? {
          abs: stats.markPx - stats.prevDayPx,
          pct: ((stats.markPx - stats.prevDayPx) / stats.prevDayPx) * 100,
        }
      : null;

  const changeTone: StatProps["tone"] = change ? (change.abs >= 0 ? "bull" : "bear") : "default";

  // OI usage. openInterest comes in base units (e.g. SOL); cap is in base lots.
  const oiCapBase = config
    ? Number(config.openInterestCapBaseLots) * Math.pow(10, -config.baseLotsDecimals)
    : null;
  const oiPct =
    stats.openInterest != null && oiCapBase && oiCapBase > 0
      ? (stats.openInterest / oiCapBase) * 100
      : null;
  const oiPctTone: StatProps["tone"] =
    oiPct == null ? "default" : oiPct > 80 ? "bear" : oiPct > 50 ? "default" : "muted";

  return (
    <header className="border border-border bg-bg-panel relative overflow-hidden">
      <div className="qn-pattern-dots absolute inset-0 opacity-50 pointer-events-none" />
      <div className="relative flex items-stretch flex-wrap">
        <div className="flex items-center gap-4 px-6 py-5 border-r border-border min-w-[18rem]">
          <img
            src="/brand/logo-mark-on-dark.svg"
            alt="QuickNode"
            width={36}
            height={36}
            className="opacity-95"
          />
          <div className="flex flex-col gap-1">
            <span className="qn-eyebrow">Phoenix · Perp</span>
            <h1 className="font-display text-[2.25rem] leading-none tracking-[-0.04em] text-fg">
              SOL<span className="text-fg-dim">-</span>
              <span className="qn-highlight">PERP</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch flex-1 divide-x divide-border">
          <Stat label="Mark" value={fmtUsd(stats.markPx, 3)} />
          <Stat
            label="24h Δ"
            value={change ? fmtPct(change.pct, 2) : "—"}
            sub={change ? fmtUsd(change.abs, 3) : undefined}
            tone={changeTone}
          />
          <Stat label="Oracle" value={fmtUsd(stats.oraclePx, 3)} tone="muted" />
          <Stat label="Mid" value={fmtUsd(stats.midPx, 3)} tone="muted" />
          <Stat label="24h Volume" value={fmtNotional(stats.dayNtlVlm)} />
          <Stat
            label="Open Interest"
            value={fmtPrice(stats.openInterest, 0) + " SOL"}
            sub={oiPct != null ? `${oiPct.toFixed(1)}% of cap` : undefined}
            tone={oiPctTone}
          />
        </div>

        <div className="flex items-center px-5 border-l border-border">
          <ConnectionStatus />
        </div>
      </div>
    </header>
  );
}
