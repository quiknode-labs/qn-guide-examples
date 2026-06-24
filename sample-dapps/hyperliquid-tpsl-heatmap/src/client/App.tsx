import { useEffect, useMemo, useRef, useState } from 'react';
import { BboState, ClientState, ClusterBucket, RecentEvent } from '../shared/types';
import { HeatmapCanvas } from './HeatmapCanvas';

function wsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export function App() {
  const [state, setState] = useState<ClientState | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<string>('');

  useEffect(() => {
    const socket = new WebSocket(wsUrl());
    socket.addEventListener('open', () => setConnected(true));
    socket.addEventListener('close', () => setConnected(false));
    socket.addEventListener('message', (event) => {
      const next = JSON.parse(event.data) as ClientState;
      setState(next);
      setSelectedCoin((current) => current || next.defaultCoin);
    });
    return () => socket.close();
  }, []);

  const coin = selectedCoin || state?.defaultCoin || 'BTC';
  const bbo = state?.bbo[coin];
  const buckets = useMemo(() => state?.buckets[coin] ?? [], [state, coin]);
  const events = state?.recentEvents[coin] ?? [];
  const topBuckets = rankPressureZones(buckets, bbo?.mid).slice(0, 6);
  const bucketSize = state?.bucketSizeByCoin[coin] ?? 0;
  const bucketPct = state?.bucketSizePct ?? 0.75;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <a className="eyebrow eyebrowLink" href="https://www.quicknode.com/chains/hyperliquid" target="_blank" rel="noreferrer">
            Quicknode Hyperliquid gRPC
          </a>
          <h1>TP/SL Heatmap</h1>
        </div>
        <div className="topbarActions">
          <AssetPicker
            coins={state?.coins ?? ['BTC']}
            selectedCoin={coin}
            onSelect={setSelectedCoin}
          />
          <StatusPill mode={state?.mode ?? 'demo'} connected={connected} status={state?.status ?? 'Connecting'} />
        </div>
      </header>

      <section className="metrics" aria-label="Market summary">
        <Metric label="Best bid" value={price(bbo?.bid)} accent="green" />
        <Metric label="Best ask" value={price(bbo?.ask)} accent="ask" />
        <Metric label="Spread" value={bps(bbo?.spreadBps)} />
        <Metric label="Visible notional" value={compact(sumNotional(buckets))} />
      </section>

      <section className="workspace">
        <div className="chartPanel">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">{coin} trigger levels</p>
              <h2>Resting TP/SL clusters</h2>
            </div>
            <div className="panelTools">
              <IntensityLegend />
              <div className="bucketLabel">~{price(bucketSize)} / {bucketPct}% buckets</div>
            </div>
          </div>
          <HeatmapCanvas buckets={buckets} bbo={bbo} />
        </div>

        <aside className="sideRail">
          <TopBuckets buckets={topBuckets} mid={bbo?.mid} />
          <EventFeed events={events} />
        </aside>
      </section>
    </main>
  );
}

function AssetPicker({
  coins,
  selectedCoin,
  onSelect,
}: {
  coins: string[];
  selectedCoin: string;
  onSelect: (coin: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="assetPicker" ref={ref}>
      <button
        className="assetButton"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{selectedCoin}</span>
        <i aria-hidden="true" />
      </button>
      {open && (
        <div className="assetMenu" role="listbox" aria-label="Select asset">
          {coins.map((coin) => (
            <button
              className={coin === selectedCoin ? 'active' : ''}
              type="button"
              role="option"
              aria-selected={coin === selectedCoin}
              key={coin}
              onClick={() => {
                onSelect(coin);
                setOpen(false);
              }}
            >
              <span>{coin}</span>
              {coin === selectedCoin && <b>Current</b>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IntensityLegend() {
  return (
    <div className="intensityLegend" aria-label="Known notional intensity">
      <span>Known notional</span>
      <i />
      <span>Higher</span>
    </div>
  );
}

function StatusPill({ mode, connected, status }: { mode: ClientState['mode']; connected: boolean; status: string }) {
  return (
    <div className={`statusPill ${mode}`}>
      <span className={connected ? 'dot live' : 'dot'} />
      <strong>{mode === 'live' ? 'Live' : 'Demo'}</strong>
      <span>{status}</span>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'ask' }) {
  return (
    <div className={`metric ${accent ?? ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TopBuckets({ buckets, mid }: { buckets: ClusterBucket[]; mid?: number | null }) {
  return (
    <section className="railPanel">
      <div className="railHeader">
        <h3>Nearby pressure</h3>
      </div>
      <div className="bucketList">
        {buckets.length === 0 && <p className="empty">Waiting for TP/SL orders.</p>}
        {buckets.map((bucket) => (
          <div className="bucketRow" key={`${bucket.coin}-${bucket.price}`}>
            <div>
              <strong>${bucket.label}</strong>
              <span>{distanceLabel(bucket.price, mid)} / TP {bucket.tpCount} / SL {bucket.slCount}</span>
            </div>
            <div className="bucketNotional">
              {compact(bucket.totalNotional)}
              {bucket.positionSizedCount > 0 && <small>{bucket.positionSizedCount} position-sized</small>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventFeed({ events }: { events: RecentEvent[] }) {
  return (
    <section className="railPanel feedPanel">
      <div className="railHeader">
        <h3>Recent flow</h3>
      </div>
      <div className="eventList">
        {events.length === 0 && <p className="empty">No events yet.</p>}
        {events.slice(0, 12).map((event) => (
          <article className={`eventItem ${event.type.toLowerCase()}`} key={event.id}>
            <div>
              <strong>{event.type}</strong>
              <span>{event.orderType}</span>
            </div>
            <div>
              <strong>${event.triggerPx.toLocaleString()}</strong>
              <span>{event.notional === null ? 'position-sized' : compact(event.notional)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function sumNotional(buckets: ClusterBucket[]): number {
  return buckets.reduce((sum, bucket) => sum + bucket.totalNotional, 0);
}

function rankPressureZones(buckets: ClusterBucket[], mid?: number | null): ClusterBucket[] {
  if (!mid) return [...buckets].sort((a, b) => b.totalNotional - a.totalNotional);
  return [...buckets]
    .filter((bucket) => Math.abs(bucket.price - mid) / mid <= 0.08)
    .sort((a, b) => {
      const distanceA = Math.abs(a.price - mid) / mid;
      const distanceB = Math.abs(b.price - mid) / mid;
      const scoreA = a.totalNotional / Math.max(0.0025, distanceA);
      const scoreB = b.totalNotional / Math.max(0.0025, distanceB);
      return scoreB - scoreA;
    });
}

function distanceLabel(priceLevel: number, mid?: number | null): string {
  if (!mid) return 'distance waiting';
  const pct = ((priceLevel - mid) / mid) * 100;
  if (Math.abs(pct) < 0.05) return 'at mid';
  return `${Math.abs(pct).toFixed(2)}% ${pct > 0 ? 'above' : 'below'}`;
}

function price(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Waiting';
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: value > 1000 ? 1 : 4 })}`;
}

function bps(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Waiting';
  return `${value.toFixed(2)} bps`;
}

function compact(value: number): string {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
