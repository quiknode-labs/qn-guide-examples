import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Gap, Marker } from "../../../shared/types.ts";
import { clock, shortClock } from "../format.ts";
import { Swatch } from "./Frame.tsx";

/** Hand-built SVG charts. Colors come from CSS variables, marks are square, numbers are Geist Mono. */

export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

export interface LineSeries {
  label: string;
  color: string;
  /** [t, value, stale] */
  points: [number, number | null, (0 | 1)?][];
  dashed?: boolean;
  step?: boolean;
  width?: number;
}

const M = { left: 56, right: 12, top: 14, bottom: 24 };

function niceDomain(values: number[], includeZero: boolean, minSpan: number): [number, number] {
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) [lo, hi] = [0, 1];
  if (includeZero) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  if (hi - lo < minSpan) {
    const mid = (hi + lo) / 2;
    lo = mid - minSpan / 2;
    hi = mid + minSpan / 2;
  }
  const pad = (hi - lo) * 0.12;
  return [lo - pad, hi + pad];
}

/** Build path strings for one series. Fresh and stale segments are drawn separately. */
function paths(series: LineSeries, x: (t: number) => number, y: (v: number) => number) {
  let fresh = "";
  let stale = "";
  let previous: [number, number, boolean] | null = null;
  for (const [t, value, staleFlag] of series.points) {
    if (value === null) {
      previous = null;
      continue;
    }
    const px = x(t);
    const py = y(value);
    const isStale = staleFlag === 1;
    if (previous) {
      const segment = series.step
        ? `M${previous[0]},${previous[1]}H${px}V${py}`
        : `M${previous[0]},${previous[1]}L${px},${py}`;
      if (isStale || previous[2]) stale += segment;
      else fresh += segment;
    }
    previous = [px, py, isStale];
  }
  return { fresh, stale };
}

function valueAt(series: LineSeries, t: number): number | null {
  let best: number | null = null;
  let bestDistance = Infinity;
  for (const [pt, value] of series.points) {
    if (value === null) continue;
    const distance = Math.abs(pt - t);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = value;
    }
  }
  return best;
}

export function TimeChart({ from, to, series, sessions = [], gaps = [], markers = [], height = 300, format, includeZero = false, minSpan = 0.5, markerSeries }: {
  from: number;
  to: number;
  series: LineSeries[];
  sessions?: [number, number][];
  gaps?: Gap[];
  markers?: Marker[];
  height?: number;
  format: (value: number) => string;
  includeZero?: boolean;
  minSpan?: number;
  /** Maps a marker's symbol to the series label it sits on. Defaults to the symbol itself. */
  markerSeries?: (marker: Marker) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const patternId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const innerW = Math.max(10, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const values = series.flatMap((s) => s.points.map((p) => p[1]).filter((v): v is number => v !== null));
  const [lo, hi] = niceDomain(values, includeZero, minSpan);
  const x = (t: number) => M.left + ((Math.min(Math.max(t, from), to) - from) / Math.max(1, to - from)) * innerW;
  const y = (v: number) => M.top + (1 - (v - lo) / (hi - lo)) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => lo + (hi - lo) * f);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Time series chart"
          onMouseMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - box.left - M.left) / innerW;
            setHover(ratio >= 0 && ratio <= 1 ? from + ratio * (to - from) : null);
          }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="4" height="8" fill="var(--grid)" />
            </pattern>
          </defs>
          <rect x={M.left} y={M.top} width={innerW} height={innerH} fill="var(--background)" stroke="var(--border)" />
          {sessions.map(([start, end]) => (
            <rect key={start} x={x(start)} y={M.top} width={Math.max(0, x(end) - x(start))} height={innerH} fill="var(--background-elevated)" />
          ))}
          {gaps.filter((gap) => (gap.to ?? to) >= from).map((gap) => (
            <g key={gap.from}>
              <rect x={x(gap.from)} y={M.top} width={Math.max(3, x(gap.to ?? to) - x(gap.from))} height={innerH} fill={`url(#${patternId})`} />
              <text x={x(gap.from) + 4} y={M.top + 12}>{gap.replayed ? "Replayed" : "No data"}</text>
            </g>
          ))}
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={M.left} x2={M.left + innerW} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" />
              <text x={M.left - 6} y={y(tick)} textAnchor="end" dominantBaseline="middle">{format(tick)}</text>
            </g>
          ))}
          {includeZero ? <line x1={M.left} x2={M.left + innerW} y1={y(0)} y2={y(0)} stroke="var(--foreground)" strokeDasharray="4 4" /> : null}
          {series.map((s) => {
            const d = paths(s, x, y);
            return (
              <g key={s.label} fill="none" strokeLinejoin="miter" strokeLinecap="square">
                <path d={d.stale} stroke="var(--foreground-light)" strokeWidth={1.5} strokeDasharray="3 3" />
                <path d={d.fresh} stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dashed ? "5 4" : undefined} />
              </g>
            );
          })}
          {markers.filter((m) => m.t >= from).map((marker, index) => {
            const target = series.find((s) => s.label === (markerSeries ? markerSeries(marker) : marker.symbol));
            const value = target ? valueAt(target, marker.t) : null;
            const cx = x(marker.t);
            const cy = value !== null ? y(value) : M.top + innerH / 2;
            const ink = "var(--foreground)";
            if (marker.kind === "mint") return <polygon key={index} points={`${cx - 5},${cy - 8} ${cx + 5},${cy - 8} ${cx},${cy - 17}`} fill={ink} />;
            if (marker.kind === "redeem") return <polygon key={index} points={`${cx - 5},${cy + 17} ${cx + 5},${cy + 17} ${cx},${cy + 8}`} fill={ink} />;
            return <rect key={index} x={cx - 5} y={cy - 5} width={10} height={10} transform={`rotate(45 ${cx} ${cy})`} fill={ink} />;
          })}
          {hover !== null ? <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + innerH} stroke="var(--foreground)" /> : null}
          <text x={M.left} y={height - 6}>{shortClock(from)}</text>
          <text x={M.left + innerW / 2} y={height - 6} textAnchor="middle">{shortClock((from + to) / 2)}</text>
          <text x={M.left + innerW} y={height - 6} textAnchor="end">now</text>
        </svg>
      ) : null}
      {hover !== null ? (
        <div className="xs-num pointer-events-none absolute top-4 right-4 flex flex-col gap-0.5 border border-(--foreground) bg-(--background) px-2 py-1 text-xs text-(--foreground)">
          <span className="text-(--foreground-medium)">{clock(hover)}</span>
          {series.map((s) => {
            const value = valueAt(s, hover);
            return (
              <span key={s.label} className="flex items-center gap-1.5">
                <Swatch color={s.color} />
                {s.label} {value === null ? "n/a" : format(value)}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Horizontal ranked bars with a label column and a value column. */
export function BarList({ rows, onSelect }: {
  rows: { key: string; label: ReactNode; value: number; display: string; color: string }[];
  onSelect?: (key: string) => void;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.key} className="grid grid-cols-[7rem_1fr_5rem] items-center gap-3">
          {onSelect ? (
            <button type="button" onClick={() => onSelect(row.key)} className="xs-num cursor-pointer truncate text-left text-sm text-(--foreground) underline decoration-(--border) underline-offset-4 hover:decoration-(--foreground)">
              {row.label}
            </button>
          ) : (
            <span className="xs-num truncate text-sm text-(--foreground)">{row.label}</span>
          )}
          <div className="h-3.5 bg-(--background-elevated)">
            <div className="h-full border border-(--foreground)" style={{ width: `${Math.max(0.5, (row.value / max) * 100)}%`, background: row.color }} />
          </div>
          <span className="xs-num text-right text-sm text-(--foreground)">{row.display}</span>
        </div>
      ))}
    </div>
  );
}

/** Stacked columns, each normalized to 100%. Used for venue share over time. */
export function ShareColumns({ times, names, values, colors, height = 240 }: {
  times: number[];
  names: string[];
  values: number[][];
  colors: string[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-1 border-b border-(--foreground)" style={{ height }} onMouseLeave={() => setHover(null)}>
        {times.map((time, column) => {
          const total = names.reduce((sum, _name, row) => sum + values[row][column], 0);
          return (
            <div key={time} className="flex flex-1 flex-col-reverse" onMouseEnter={() => setHover(column)}>
              {total === 0 ? (
                <div className="xs-stripes h-full w-full" />
              ) : (
                names.map((name, row) => (
                  <div key={name} className="w-full border border-(--foreground) border-b-0" style={{ height: `${(values[row][column] / total) * 100}%`, background: colors[row], display: values[row][column] === 0 ? "none" : undefined }} />
                ))
              )}
            </div>
          );
        })}
      </div>
      <div className="xs-num flex justify-between text-xs text-(--foreground-medium)">
        <span>{times.length ? shortClock(times[0]) : ""}</span>
        <span>
          {hover !== null
            ? `${shortClock(times[hover])}  ${names.map((name, row) => {
                const total = names.reduce((sum, _n, r) => sum + values[r][hover], 0);
                return total ? `${name} ${Math.round((values[row][hover] / total) * 100)}%` : "";
              }).filter(Boolean).join(" · ") || "no trades"}`
            : ""}
        </span>
        <span>now</span>
      </div>
    </div>
  );
}

/** Bars above and below a zero line. Used for net mint and redeem per ticker. */
export function DivergingBars({ rows, positiveColor, negativeColor, format, height = 200 }: {
  rows: { label: string; value: number }[];
  positiveColor: string;
  negativeColor: string;
  format: (value: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));
  const half = (height - 40) / 2;
  return (
    <div className="flex items-stretch gap-2" style={{ height }}>
      {rows.map((row) => (
        <div key={row.label} className="flex min-w-0 flex-1 flex-col items-center" title={`${row.label} ${format(row.value)}`}>
          <div className="flex w-full flex-col justify-end" style={{ height: half }}>
            {row.value > 0 ? <div className="mx-auto w-3/4 border border-(--foreground)" style={{ height: `${(row.value / max) * 100}%`, background: positiveColor }} /> : null}
          </div>
          <div className="h-px w-full bg-(--foreground)" />
          <div className="w-full" style={{ height: half }}>
            {row.value < 0 ? <div className="mx-auto w-3/4 border border-(--foreground)" style={{ height: `${(-row.value / max) * 100}%`, background: negativeColor }} /> : null}
          </div>
          <span className="xs-num mt-1 truncate text-xs text-(--foreground)">{row.label}</span>
          <span className="xs-num truncate text-xs text-(--foreground-medium)">{format(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

/** Plain columns over time. */
export function Columns({ bars, color, format, height = 180 }: {
  bars: { t: number; usd: number }[];
  color: string;
  format: (value: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...bars.map((bar) => bar.usd));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-1 border-b border-(--foreground)" style={{ height }}>
        {bars.map((bar) => (
          <div key={bar.t} className="flex-1" title={`${shortClock(bar.t)} ${format(bar.usd)}`} style={{ height: "100%", display: "flex", alignItems: "flex-end" }}>
            <div className={bar.usd > 0 ? "w-full border border-(--foreground) border-b-0" : "w-full"} style={{ height: `${(bar.usd / max) * 100}%`, background: color }} />
          </div>
        ))}
      </div>
      <div className="xs-num flex justify-between text-xs text-(--foreground-medium)">
        <span>{bars.length ? shortClock(bars[0].t) : ""}</span>
        <span>now</span>
      </div>
    </div>
  );
}

/** One horizontal bar split into segments. Used for where tokens go. */
export function SplitBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (total === 0) return <div className="xs-stripes h-8 border border-(--foreground)" />;
  return (
    <div className="flex h-8 border border-(--foreground)">
      {parts.filter((part) => part.value > 0).map((part) => (
        <div key={part.label} title={part.label} className="h-full border-r border-(--foreground) last:border-r-0" style={{ width: `${(part.value / total) * 100}%`, background: part.color }} />
      ))}
    </div>
  );
}

/** Re-render on an interval, for countdowns and ages. */
export function useTick(ms: number) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(timer);
  }, [ms]);
}
