import { useEffect, useState } from "react";

/**
 * Returns the milliseconds remaining until the next funding interval boundary.
 *
 * Phoenix funding intervals are 1h. The implementation assumes the
 * interval grid is aligned to the Unix epoch (UTC) — true for hourly /
 * daily intervals on every venue we've seen.
 */
export function useFundingCountdown(intervalSeconds: number | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!intervalSeconds || intervalSeconds <= 0) return null;
  const intervalMs = intervalSeconds * 1000;
  const nextBoundary = Math.ceil(now / intervalMs) * intervalMs;
  return nextBoundary - now;
}

export function formatCountdown(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "—";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
