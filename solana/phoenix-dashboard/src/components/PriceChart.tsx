import { useEffect, useMemo, useRef } from "react";
import {
  CandlestickSeries,
  LineSeries,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
} from "lightweight-charts";
import type { FundingPoint, MarketConfig, Timeframe } from "../types";
import { usePhoenix } from "../ws/PhoenixWebSocket";
import { fmtPct, fmtUsd } from "../utils/format";
import { formatCountdown, useFundingCountdown } from "../utils/useFundingCountdown";

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];
const MAX_OVERLAY_POINTS = 600;
const SPREAD_ALERT_BPS = 10; // 0.10%

// QN chart palette + foreground tones used inside the lightweight-charts canvas.
// (canvas can't read CSS vars at runtime, so the hex values are pinned here.)
const QN_GRID = "rgba(255,255,255,0.07)";
const QN_BORDER = "rgba(255,255,255,0.18)";
const QN_FG_MUTED = "rgba(255,255,255,0.55)";
const QN_BULL = "#6ec692"; // oklch(73.23% 0.139 161.34) — chart-9-green
const QN_BEAR = "#e9787e"; // oklch(71.66% 0.155 13.91)  — chart-11-red
const QN_ACCENT = "#6CFF75";
const QN_OVERLAY = "#c08bff"; // muted purple line for oracle overlay

const CHART_OPTIONS = {
  layout: {
    background: { color: "transparent" } as const,
    textColor: QN_FG_MUTED,
    fontFamily: '"Geist Mono", ui-monospace, monospace',
  },
  grid: {
    vertLines: { color: QN_GRID },
    horzLines: { color: QN_GRID },
  },
  rightPriceScale: { borderColor: QN_BORDER },
  timeScale: { borderColor: QN_BORDER, timeVisible: true, secondsVisible: false },
  crosshair: { mode: 0 },
  autoSize: true,
};

interface PriceChartProps {
  config: MarketConfig | null;
}

export function PriceChart({ config }: PriceChartProps) {
  const { candles, stats, timeframe, setTimeframe, fundingHistory } = usePhoenix();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const oracleSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markBufferRef = useRef<LineData<UTCTimestamp>[]>([]);
  const oracleBufferRef = useRef<LineData<UTCTimestamp>[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, CHART_OPTIONS);
    chartRef.current = chart;

    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: QN_BULL,
      downColor: QN_BEAR,
      wickUpColor: QN_BULL,
      wickDownColor: QN_BEAR,
      borderVisible: false,
    });
    markSeriesRef.current = chart.addSeries(LineSeries, {
      color: QN_ACCENT,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    oracleSeriesRef.current = chart.addSeries(LineSeries, {
      color: QN_OVERLAY,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      markSeriesRef.current = null;
      oracleSeriesRef.current = null;
    };
  }, []);

  // Push candles into the candle series whenever they change.
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;
    const data: CandlestickData<UTCTimestamp>[] = candles.map((c) => ({
      time: Math.floor(c.time / 1000) as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    series.setData(data);
  }, [candles]);

  // Reset overlay buffers whenever the timeframe changes.
  useEffect(() => {
    markBufferRef.current = [];
    oracleBufferRef.current = [];
    markSeriesRef.current?.setData([]);
    oracleSeriesRef.current?.setData([]);
  }, [timeframe]);

  // Append mark/oracle points as fresh stats arrive.
  useEffect(() => {
    const t = Math.floor(Date.now() / 1000) as UTCTimestamp;
    if (stats.markPx != null) {
      const buf = markBufferRef.current;
      if (!buf.length || buf[buf.length - 1].time !== t) {
        buf.push({ time: t, value: stats.markPx });
      } else {
        buf[buf.length - 1] = { time: t, value: stats.markPx };
      }
      if (buf.length > MAX_OVERLAY_POINTS) buf.shift();
      markSeriesRef.current?.setData(buf);
    }
    if (stats.oraclePx != null) {
      const buf = oracleBufferRef.current;
      if (!buf.length || buf[buf.length - 1].time !== t) {
        buf.push({ time: t, value: stats.oraclePx });
      } else {
        buf[buf.length - 1] = { time: t, value: stats.oraclePx };
      }
      if (buf.length > MAX_OVERLAY_POINTS) buf.shift();
      oracleSeriesRef.current?.setData(buf);
    }
  }, [stats.markPx, stats.oraclePx]);

  const spread = useMemo(() => {
    if (stats.markPx == null || stats.oraclePx == null) return null;
    const abs = stats.markPx - stats.oraclePx;
    const bps = stats.oraclePx !== 0 ? (abs / stats.oraclePx) * 10_000 : 0;
    return { abs, bps };
  }, [stats.markPx, stats.oraclePx]);

  const spreadTone =
    spread && Math.abs(spread.bps) > SPREAD_ALERT_BPS ? "text-bear" : "text-fg-muted";

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-5">
          <span className="qn-eyebrow">Price</span>
          <div className="flex items-center gap-px border border-border">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 font-mono uppercase text-[11px] tracking-wide transition-colors ${
                  timeframe === tf
                    ? "bg-accent text-accent-fg"
                    : "text-fg-dim hover:bg-bg-hover hover:text-fg"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-wide">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-px bg-accent" />
            <span className="text-fg-dim">Mark</span>
            <span className="text-fg tabular-nums normal-case">{fmtUsd(stats.markPx, 3)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-px"
              style={{ background: "#c08bff", boxShadow: "inset 0 0 0 1px #c08bff" }}
            />
            <span className="text-fg-dim">Oracle</span>
            <span className="text-fg tabular-nums normal-case">{fmtUsd(stats.oraclePx, 3)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-fg-dim">Spread</span>
            <span className={`tabular-nums normal-case ${spreadTone}`}>
              {spread ? `${fmtPct(spread.bps / 100, 3)} (${spread.bps.toFixed(1)} bps)` : "—"}
            </span>
          </span>
        </div>
      </div>
      <div ref={containerRef} className="h-[420px]" />
      <FundingHistoryStrip
        history={fundingHistory}
        currentRate={stats.funding}
        intervalSeconds={config?.fundingIntervalSeconds ?? null}
      />
    </div>
  );
}

function FundingHistoryStrip({
  history,
  currentRate,
  intervalSeconds,
}: {
  history: FundingPoint[];
  currentRate: number | null;
  intervalSeconds: number | null;
}) {
  const countdownMs = useFundingCountdown(intervalSeconds);
  const aprRate =
    currentRate != null && intervalSeconds && intervalSeconds > 0
      ? currentRate * (31_536_000 / intervalSeconds) * 100
      : null;
  const aprTone =
    aprRate == null ? "text-fg-muted" : aprRate < 0 ? "text-bull" : "text-bear";

  if (!history.length) {
    return (
      <div className="border-t border-border px-4 py-2.5 flex items-center gap-5">
        <div className="flex flex-col gap-0.5 min-w-[8rem]">
          <span className="qn-eyebrow">Funding · this session</span>
          <span
            className={`font-mono tabular-nums text-sm ${
              currentRate == null
                ? "text-fg-muted"
                : currentRate < 0
                  ? "text-bull"
                  : "text-bear"
            }`}
          >
            {currentRate != null ? fmtPct(currentRate * 100, 4) : "—"}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost">
            waiting for stream
          </span>
        </div>
        <FundingApr aprRate={aprRate} aprTone={aprTone} countdownMs={countdownMs} />
      </div>
    );
  }

  const last = history[history.length - 1];
  const rates = history.map((p) => p.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const span = Math.max(max - min, 1e-9);
  const W = 200;
  const H = 32;

  const x = (i: number) => (history.length === 1 ? W / 2 : (i / (history.length - 1)) * W);
  const y = (r: number) => H - 4 - ((r - min) / span) * (H - 8);

  // Step-line path
  const pathSteps: string[] = [];
  history.forEach((p, i) => {
    const px = x(i);
    const py = y(p.rate);
    if (i === 0) pathSteps.push(`M ${px} ${py}`);
    else pathSteps.push(`H ${px}`, `V ${py}`);
  });
  const stepPath = pathSteps.join(" ");

  // Zero baseline only if it sits inside the range.
  const zeroInRange = min <= 0 && max >= 0;
  const zeroY = zeroInRange ? y(0) : null;

  const firstSeen = history[0].time;
  const sessionMs = Date.now() - firstSeen;
  const sessionLabel =
    sessionMs > 3600_000
      ? `${Math.floor(sessionMs / 3600_000)}h`
      : sessionMs > 60_000
        ? `${Math.floor(sessionMs / 60_000)}m`
        : `${Math.floor(sessionMs / 1000)}s`;

  return (
    <div className="border-t border-border px-4 py-2.5 flex items-center gap-5">
      <div className="flex flex-col gap-0.5 min-w-[8rem]">
        <span className="qn-eyebrow">Funding · this session</span>
        <span
          className={`font-mono tabular-nums text-sm ${last.rate < 0 ? "text-bull" : "text-bear"}`}
        >
          {fmtPct(last.rate * 100, 4)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost">
          {history.length} updates · {sessionLabel}
        </span>
      </div>

      <div className="flex-1 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost whitespace-nowrap">
          min {fmtPct(min * 100, 4)}
        </span>
        <svg
          className="flex-1 h-[44px]"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
        >
          {zeroY != null && (
            <line
              x1={0}
              x2={W}
              y1={zeroY}
              y2={zeroY}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          )}
          <path
            d={stepPath}
            fill="none"
            stroke={last.rate < 0 ? "#6ec692" : "#e9787e"}
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={x(history.length - 1)}
            cy={y(last.rate)}
            r="1.6"
            fill={last.rate < 0 ? "#6ec692" : "#e9787e"}
          />
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost whitespace-nowrap">
          max {fmtPct(max * 100, 4)}
        </span>
      </div>

      <FundingApr aprRate={aprRate} aprTone={aprTone} countdownMs={countdownMs} />
    </div>
  );
}

function FundingApr({
  aprRate,
  aprTone,
  countdownMs,
}: {
  aprRate: number | null;
  aprTone: string;
  countdownMs: number | null;
}) {
  return (
    <div className="flex flex-col gap-0.5 items-end min-w-[7rem] border-l border-border pl-5">
      <span className="qn-eyebrow">Annualized</span>
      <span className={`font-mono tabular-nums text-sm ${aprTone}`}>
        {aprRate != null ? fmtPct(aprRate, 2) : "—"} APR
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost">
        next in {formatCountdown(countdownMs)}
      </span>
    </div>
  );
}
