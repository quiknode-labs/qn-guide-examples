"use client";

import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { MetricsBar } from "@/components/layout/MetricsBar";
import { L2Panel } from "@/components/orderbook/L2Panel";
import { L4Panel } from "@/components/orderflow/L4Panel";
import { useL2Stream } from "@/hooks/useL2Stream";
import { useL4Stream } from "@/hooks/useL4Stream";
import { useMetrics } from "@/hooks/useMetrics";
import { useCoinSelector } from "@/hooks/useCoinSelector";

export default function Home() {
  const { coin, selectCoin } = useCoinSelector("BTC");
  const { data: l2Data, prevData: l2PrevData, status: l2Status, blockNumber } = useL2Stream(coin);
  const { feedEvents, snapshotInfo, status: l4Status } = useL4Stream(coin);
  const metrics = useMetrics(l2Data, feedEvents);

  const glowColor = useMemo(() => {
    const imb = metrics.bookImbalance;
    const strength = Math.min(Math.abs(imb), 0.5) / 0.5;
    const alpha = (0.12 + strength * 0.25).toFixed(2);
    if (imb >= 0.02) return `rgba(16, 185, 129, ${alpha})`;
    if (imb <= -0.02) return `rgba(239, 68, 68, ${alpha})`;
    return "rgba(255, 255, 255, 0.08)";
  }, [metrics.bookImbalance]);

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg-base)] relative overflow-hidden">
      <div className="bg-orb bg-orb--bid" />
      <div className="bg-orb bg-orb--ask" />
      <div className="bg-orb bg-orb--accent" />
      <div className="bg-vignette" />
      <div className="bg-noise" />

      <div
        className="relative z-10 flex flex-col w-full max-w-[1200px] h-[calc(100vh-80px)] gap-4 mx-auto px-6"
        style={{ "--glow-color": glowColor } as React.CSSProperties}
      >
        <Header
          coin={coin}
          onCoinSelect={selectCoin}
          l2Status={l2Status}
          l4Status={l4Status}
          blockNumber={blockNumber}
        />

        <MetricsBar metrics={metrics} coin={coin} />

        <div className="flex-1 min-h-0 flex gap-4">
          <L2Panel
            data={l2Data}
            prevData={l2PrevData}
            coin={coin}
            className="w-[380px] shrink-0"
          />
          <L4Panel
            events={feedEvents}
            snapshotInfo={snapshotInfo}
            coin={coin}
            status={l4Status}
            className="flex-1 min-w-0"
          />
        </div>
      </div>
    </div>
  );
}
