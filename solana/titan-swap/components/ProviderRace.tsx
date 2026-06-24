"use client";

import type { Token, TitanSwapRoute } from "@/lib/types";

interface ProviderRaceProps {
  quotes: TitanSwapRoute[];
  expectedWinner: string | null;
  toToken: Token;
  latencyMs: number | null;
  loading: boolean;
}

/**
 * The headline of the demo: Titan sources quotes from multiple competing
 * providers and we show every one of them racing for the best output — the
 * thing an execute-for-you aggregator hides behind a single number.
 */
export function ProviderRace({
  quotes,
  expectedWinner,
  toToken,
  latencyMs,
  loading,
}: ProviderRaceProps) {
  const best = quotes.length ? parseInt(quotes[0].outAmount) : 0;
  const winnerId = expectedWinner ?? (quotes[0]?.provider || null);

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="qn-eyebrow">Provider Race</span>
        <div className="flex items-center gap-2">
          {latencyMs != null && (
            <span className="font-mono text-[10px] text-fg-ghost tabular-nums">
              {latencyMs} ms
            </span>
          )}
          <span className="font-mono text-[10px] text-fg-dim uppercase tabular-nums">
            {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {loading && quotes.length === 0 && (
          <div className="font-mono text-xs text-fg-dim py-2">Polling providers…</div>
        )}

        {!loading && quotes.length === 0 && (
          <div className="font-mono text-xs text-fg-ghost py-2">
            Enter an amount to see providers compete.
          </div>
        )}

        {quotes.map((q) => {
          const out = parseInt(q.outAmount) / Math.pow(10, toToken.decimals);
          const pct = best > 0 ? (parseInt(q.outAmount) / best) * 100 : 0;
          const isWinner = q.provider === winnerId;
          // basis points behind the best output
          const bpsBehind =
            best > 0 ? ((best - parseInt(q.outAmount)) / best) * 10000 : 0;

          return (
            <div key={q.provider} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono uppercase tracking-wide ${
                      isWinner ? "text-fg" : "text-fg-muted"
                    }`}
                  >
                    {q.provider}
                  </span>
                  {isWinner && <span className="qn-badge qn-badge--accent">Best</span>}
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <span className={isWinner ? "text-fg" : "text-fg-muted"}>
                    {out.toFixed(toToken.decimals > 6 ? 6 : toToken.decimals)}
                  </span>
                  <span className="text-fg-ghost w-14 text-right">
                    {isWinner ? "—" : `-${bpsBehind.toFixed(1)} bps`}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-bg-hover overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: isWinner ? "var(--accent)" : "var(--border-strong)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
