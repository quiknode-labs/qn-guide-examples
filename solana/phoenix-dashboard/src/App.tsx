import { useEffect, useState } from "react";
import { PhoenixProvider } from "./ws/PhoenixWebSocket";
import { MarketOverview } from "./components/MarketOverview";
import { PriceChart } from "./components/PriceChart";
import { Orderbook } from "./components/Orderbook";
import { TradeFeed } from "./components/TradeFeed";
import { MarketInfo } from "./components/MarketInfo";
import { fetchCandles, fetchMarketConfig } from "./api";
import type { Candle, MarketConfig } from "./types";

export default function App() {
  const [marketConfig, setMarketConfig] = useState<MarketConfig | null>(null);
  const [seedCandles, setSeedCandles] = useState<Candle[]>([]);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMarketConfig("SOL"), fetchCandles("SOL", "1m", 500)])
      .then(([cfg, candles]) => {
        if (cancelled) return;
        setMarketConfig(cfg);
        setSeedCandles(candles);
      })
      .catch((err) => {
        if (cancelled) return;
        setSeedError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PhoenixProvider initialCandles={seedCandles}>
      <div className="min-h-screen flex flex-col gap-4 p-4 lg:p-6">
        {seedError && (
          <div className="border border-bear/40 bg-bear/10 text-bear font-mono uppercase text-[11px] tracking-wide px-3 py-2">
            // REST seed failed: {seedError}
          </div>
        )}
        <MarketOverview config={marketConfig} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <PriceChart config={marketConfig} />
            <MarketInfo config={marketConfig} />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Orderbook />
            <TradeFeed />
          </div>
        </div>
        <footer className="border-t border-border pt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-fg-ghost">
          <span>// Data · perp-api.phoenix.trade</span>
          <span>// QuickNode × Phoenix · SOL-PERP</span>
        </footer>
      </div>
    </PhoenixProvider>
  );
}
