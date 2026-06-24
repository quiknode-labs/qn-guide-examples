"use client";

import { useMemo } from "react";
import type { TitanRouteStep, TitanSwapRoute, TitanVenues } from "@/lib/types";

interface VenueSplitProps {
  venues: TitanVenues;
  route: TitanSwapRoute | null;
}

/**
 * Group route steps by hop depth so parallel first-hop splits read differently
 * from sequential conversions. A step's hop = how far its input mint is from
 * the route's source mint: steps consuming the source are hop 1 (and if there
 * are several, they're a split); a step consuming an intermediate token is a
 * later hop.
 */
function groupByHop(steps: TitanRouteStep[]): [number, TitanRouteStep[]][] {
  const producedMints = new Set(steps.map((s) => s.outputMint));
  const memo = new Map<string, number>();

  const mintDepth = (mint: string, guard = new Set<string>()): number => {
    if (!producedMints.has(mint)) return 0; // source mint
    if (memo.has(mint)) return memo.get(mint)!;
    if (guard.has(mint)) return 0; // cycle guard
    guard.add(mint);
    let d = 0;
    for (const s of steps) {
      if (s.outputMint === mint) d = Math.max(d, mintDepth(s.inputMint, guard) + 1);
    }
    memo.set(mint, d);
    return d;
  };

  const groups = new Map<number, TitanRouteStep[]>();
  for (const s of steps) {
    const hop = mintDepth(s.inputMint) + 1;
    if (!groups.has(hop)) groups.set(hop, []);
    groups.get(hop)!.push(s);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]);
}

export function VenueSplit({ venues, route }: VenueSplitProps) {
  const steps = useMemo(() => route?.steps ?? [], [route]);
  const hops = useMemo(() => groupByHop(steps), [steps]);

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="qn-eyebrow">Route Split</span>
        <span className="font-mono text-[10px] text-fg-dim uppercase tabular-nums">
          {hops.length
            ? `${hops.length} ${hops.length === 1 ? "hop" : "hops"}`
            : `${venues.labels.length} venues`}
        </span>
      </div>

      <div className="p-3">
        {steps.length === 0 ? (
          <div className="font-mono text-xs text-fg-ghost py-1">
            {route
              ? "No venue breakdown for this route."
              : "Enter an amount to see the route Titan builds."}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {hops.map(([hop, hopSteps]) => {
                const isSplit = hopSteps.length > 1;
                return (
                  <div key={hop} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="stat-label">
                        Hop {hop}
                        {isSplit ? ` · split ${hopSteps.length} ways` : ""}
                      </span>
                      <span className="font-mono text-[9px] text-fg-ghost uppercase tracking-wider">
                        {isSplit ? "parallel" : "sequential"}
                      </span>
                    </div>
                    {hopSteps.map((s, i) => (
                      <div key={`${s.ammKey}-${i}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-fg uppercase tracking-wide">{s.label}</span>
                          {/* % only matters when a hop is split across venues */}
                          {isSplit && (
                            <span className="text-fg-dim tabular-nums">
                              {s.allocPct.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        {isSplit && (
                          <div className="h-1.5 bg-bg-hover overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${Math.max(Math.min(s.allocPct, 100), 2)}%`,
                                background: "var(--accent)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
