import { DAY_MS, DISCLAIMER, MAX_EVENTS, MAX_SAMPLES, REF_AGING_MS, REF_STALE_MS, SAMPLE_SECONDS } from "./config.ts";
import { isMarketOpen, marketSessions } from "./market.ts";
import { type MintState, multiplierAt, rawToShares } from "./registry.ts";
import type { Classified } from "./classify.ts";
import type {
  CorporateAction, DecodedEvent, EventType, Gap, Marker, Opportunity, SignalRow, Slippage, Snapshot, SnapshotParams,
  StartupStep, Status, TickerDetail,
} from "../shared/types.ts";

interface Sample { t: number; on: number | null; ref: number | null; stale: boolean }

interface TickerRuntime {
  startSupplyRaw: bigint;
  /** [t, shares] after each supply change seen on the account stream. */
  supplySteps: [number, number][];
  /**
   * Net raw amount of decoded mints and redeems. Kept raw so it converts at the same multiplier
   * as the supply change, or a dividend or split would make the cross-check disagree.
   */
  decodedNetRaw: number;
  lastPrice: number | null;
  lastPriceT: number | null;
  /** Dollars and shares traded since the last sample, for a volume-weighted price. */
  accUsd: number;
  accShares: number;
  samples: Sample[];
  /** Start of an open "premium after mint" episode, if any. */
  episodeStart: number | null;
  closeDurations: number[];
  /** Last reference price seen while the US market was open. */
  lastSessionRef: number | null;
  /** Slot and write version of the newest account update applied, so replays can't move it back. */
  accountSlot: number;
  accountWrite: bigint;
}

const TRADE = new Set<EventType>(["buy", "sell"]);
const WINDOW_MS = { "15m": 15 * 60_000, "1h": 60 * 60_000, all: DAY_MS } as const;
/** Fresh premium samples needed before a z-score is shown. 20 samples at 15s is 5 minutes. */
const MIN_BASELINE_SAMPLES = 20;

/** Net minted or redeemed below this, in dollars, is left out of the per-ticker bars. */
const NET_MINT_MIN_USD = 1;

// "Worth a look" rules: tickers trading unusually far below their stock price, where a $10K buy
// still lands below it. Flagged only while the US market is open, on a fresh stock price,
// once the ticker's baseline is learned, and only after the condition has held for a minute.
const FLAG_Z = 2;
const FLAG_HOLD_MS = 60_000;
/** Below the stock: the gap must be at least this wide, and a $10K buy must still land below the stock. */
const FLAG_BELOW_MIN_PCT = 0.25;
/** The token must have traded this recently, so the gap reflects a live price. */
const FLAG_LAST_TRADE_MS = 5 * 60_000;
/** A quote older than this is not used for alerts or shown as a cost. */
const FLAG_QUOTE_MS = 3 * 60_000;
/** A last trade older than this is too old to compare with the current stock price. */
const ONCHAIN_STALE_MS = 15 * 60_000;


function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Thin a series to at most `max` points, always keeping the last one. */
function thin<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out[out.length - 1] = points[points.length - 1];
  return out;
}

export class Store {
  readonly startedAt = Date.now();
  mints = new Map<string, MintState>();
  private bySymbol = new Map<string, string>();
  private runtime = new Map<string, TickerRuntime>();
  private events: DecodedEvent[] = [];
  private nextId = 1;
  private applied: CorporateAction[] = [];
  private lastCorporateCheck = Math.floor(Date.now() / 1000);
  refs = new Map<string, { price: number; updatedAt: number }>();
  solPrice: number | null = null;
  quotes = new Map<string, { t: number; sizes: Slippage[] }>();
  /** Tickers close to being flagged. The quote poller prices them so the cost check can run. */
  quoteCandidates: string[] = [];
  private flagSince = new Map<string, number>();
  private opportunities: Opportunity[] = [];
  poolOwners = new Set<string>();

  status: Status = {
    phase: "starting",
    steps: [
      { key: "registry", label: "Finding xStocks mints", state: "active", detail: "" },
      { key: "state", label: "Reading supply and multipliers", state: "pending", detail: "" },
      { key: "filters", label: "Building compressed filters", state: "pending", detail: "2 filters" },
      { key: "stream", label: "Connecting to Solana gRPC", state: "pending", detail: "finalized" },
    ],
    progress: 0,
    slot: null,
    slotTime: null,
    mints: 0,
    registrySource: null,
    startedAt: this.startedAt,
    marketOpen: isMarketOpen(Date.now()),
    reconnect: null,
    gaps: [],
    counters: { transactions: 0, falsePositives: 0, accountUpdates: 0, events: 0 },
    error: null,
  };

  // ---- startup and stream state -------------------------------------------------------------

  step(key: string, patch: Partial<StartupStep>) {
    const step = this.status.steps.find((s) => s.key === key);
    if (step) Object.assign(step, patch);
    const done = this.status.steps.filter((s) => s.state === "done").length;
    this.status.progress = Math.round((done / this.status.steps.length) * 100);
  }

  openGap(reason: string, attempt: number, retryAt: number) {
    this.status.phase = this.status.phase === "starting" ? "starting" : "reconnecting";
    this.status.reconnect = { attempt, retryAt, reason };
    const last = this.status.gaps.at(-1);
    if (this.status.phase === "reconnecting" && (!last || last.to !== null)) {
      this.status.gaps.push({ from: this.status.slotTime ?? Date.now(), to: null, replayed: false });
    }
  }

  closeGap(replayed: boolean) {
    this.status.phase = "live";
    this.status.reconnect = null;
    const last = this.status.gaps.at(-1);
    if (last && last.to === null) {
      last.to = Date.now();
      last.replayed = replayed;
    }
    if (this.status.gaps.length > 200) this.status.gaps.splice(0, this.status.gaps.length - 200);
  }

  // ---- registry -----------------------------------------------------------------------------

  /** Add or replace mint state from the registry. Returns the addresses that are new. */
  setMints(states: Map<string, MintState>): string[] {
    const added: string[] = [];
    for (const [address, state] of states) {
      if (!this.mints.has(address)) {
        added.push(address);
        this.runtime.set(address, {
          startSupplyRaw: state.supplyRaw,
          supplySteps: [[Date.now(), rawToShares(state, state.supplyRaw, Date.now() / 1000)]],
          decodedNetRaw: 0,
          lastPrice: null, lastPriceT: null, accUsd: 0, accShares: 0,
          samples: [], episodeStart: null, closeDurations: [], lastSessionRef: null, accountSlot: 0, accountWrite: 0n,
        });
        this.mints.set(address, state);
        this.bySymbol.set(state.symbol, address);
      }
    }
    this.status.mints = this.mints.size;
    return added;
  }

  symbolToMint(symbol: string) {
    return this.bySymbol.get(symbol);
  }

  refPrice = (mint: string): number | null => this.refs.get(mint)?.price ?? null;

  /** Mints worth polling a reference price for: anything traded since startup, most recent first. */
  /** Every mint with at least one trade since startup. Never trimmed, so the count only grows. */
  private tradedMints = new Set<string>();

  activeMints(limit: number): string[] {
    const seen = new Set<string>();
    for (let i = this.events.length - 1; i >= 0 && seen.size < limit; i--) seen.add(this.events[i].mint);
    return [...seen];
  }

  // ---- ingest -------------------------------------------------------------------------------

  addEvents(classified: Classified[]) {
    for (const item of classified) {
      const event: DecodedEvent = { ...item, id: this.nextId++ };
      this.events.push(event);
      if (TRADE.has(event.type)) this.tradedMints.add(event.mint);
      const rt = this.runtime.get(event.mint);
      if (!rt) continue;
      if (TRADE.has(event.type) && event.price !== null && (event.usd ?? 0) >= 5) {
        rt.accUsd += event.usd!;
        rt.accShares += event.shares;
        rt.lastPrice = event.price;
        rt.lastPriceT = event.t;
      }
      if (event.type === "mint" || event.type === "redeem") {
        const state = this.mints.get(event.mint);
        if (state) {
          // Back to raw units with the multiplier the classifier used at block time.
          const raw = (event.shares / multiplierAt(state, Math.floor(event.t / 1000))) * 10 ** state.decimals;
          rt.decodedNetRaw += event.type === "mint" ? raw : -raw;
        }
        if (event.type === "mint" && rt.episodeStart === null) {
          const premium = this.currentPremium(event.mint);
          if (premium !== null && premium >= 0.2) rt.episodeStart = event.t;
        }
      }
    }
    this.status.counters.events = this.events.length;
    if (this.events.length > MAX_EVENTS) this.events.splice(0, this.events.length - Math.floor(MAX_EVENTS * 0.9));
  }

  /** A mint account changed. The account stream is the source of truth for supply and the multiplier. */
  onMintAccount(next: MintState, t: number, slot = Number.MAX_SAFE_INTEGER, writeVersion = 0n) {
    const previous = this.mints.get(next.address);
    const rt = this.runtime.get(next.address);
    if (!previous || !rt) return;
    // A reconnect replays recent slots. Ignore any write older than the one already applied.
    if (slot < rt.accountSlot || (slot === rt.accountSlot && writeVersion <= rt.accountWrite)) return;
    rt.accountSlot = slot;
    rt.accountWrite = writeVersion;
    const seconds = Math.floor(t / 1000);
    if (next.supplyRaw !== previous.supplyRaw) {
      rt.supplySteps.push([t, rawToShares(next, next.supplyRaw, seconds)]);
      if (rt.supplySteps.length > 2000) rt.supplySteps.splice(1, rt.supplySteps.length - 2000);
    }
    const before = multiplierAt(previous, seconds);
    const after = multiplierAt(next, seconds);
    if (Math.abs(after / before - 1) > 1e-12) this.recordApplied(next, before, after, t);
    this.mints.set(next.address, next);
  }

  private recordApplied(mint: MintState, from: number, to: number, t: number) {
    this.applied.push({ symbol: mint.symbol, mint: mint.address, from, to, kind: actionKind(from, to), t });
    if (this.applied.length > 500) this.applied.shift();
    const rt = this.runtime.get(mint.address);
    if (rt) rt.supplySteps.push([t, rawToShares(mint, mint.supplyRaw, Math.floor(t / 1000))]);
  }

  // ---- periodic sampling --------------------------------------------------------------------

  /** Called every SAMPLE_SECONDS. Records one premium sample per traded ticker and ages out old data. */
  sample() {
    const now = Date.now();
    const open = isMarketOpen(now);
    this.status.marketOpen = open;
    for (const [mint, rt] of this.runtime) {
      if (rt.lastPrice === null && rt.samples.length === 0) continue;
      const ref = this.refs.get(mint);
      const traded = rt.accShares > 0;
      const recent = rt.lastPriceT !== null && now - rt.lastPriceT <= ONCHAIN_STALE_MS;
      const on = traded ? rt.accUsd / rt.accShares : recent ? rt.lastPrice : null;
      rt.accUsd = 0;
      rt.accShares = 0;
      const stale = !ref || now - ref.updatedAt > REF_STALE_MS;
      if (ref && open && !stale) rt.lastSessionRef = ref.price;
      rt.samples.push({ t: now, on, ref: ref?.price ?? null, stale });
      if (rt.samples.length > MAX_SAMPLES) rt.samples.shift();
      // Only a trade in this interval can show the gap closing. A stock move alone does not.
      if (rt.episodeStart !== null && traded && on !== null && ref && !stale) {
        const premium = (on / ref.price - 1) * 100;
        if (premium <= 0.05) {
          rt.closeDurations.push((now - rt.episodeStart) / 1000);
          if (rt.closeDurations.length > 200) rt.closeDurations.shift();
          rt.episodeStart = null;
        }
      }
    }
    // Scheduled multiplier changes that took effect since the last check.
    const seconds = Math.floor(now / 1000);
    for (const mint of this.mints.values()) {
      const at = mint.newMultiplierEffectiveTimestamp;
      if (at > this.lastCorporateCheck && at <= seconds && mint.newMultiplier !== mint.multiplier) {
        this.recordApplied(mint, mint.multiplier, mint.newMultiplier, at * 1000);
      }
    }
    this.lastCorporateCheck = seconds;
    this.evaluateOpportunities(now);
    // Rolling 24h cap.
    const cutoff = now - DAY_MS;
    let drop = 0;
    while (drop < this.events.length && this.events[drop].t < cutoff) drop++;
    if (drop > 0) this.events.splice(0, drop);
    this.status.gaps = this.status.gaps.filter((gap) => gap.to === null || gap.to > cutoff);
  }

  /** Dollar value of shares at the current stock price, or the last trade price when there is none. */
  private valueShares(mint: string, shares: number): number {
    const price = this.refs.get(mint)?.price ?? this.runtime.get(mint)?.lastPrice ?? 0;
    return shares * price;
  }

  private currentPremium(mint: string): number | null {
    const rt = this.runtime.get(mint);
    const ref = this.refs.get(mint);
    if (!rt || rt.lastPrice === null || !ref) return null;
    return (rt.lastPrice / ref.price - 1) * 100;
  }

  // ---- snapshot -----------------------------------------------------------------------------

  private upcoming(now: number): CorporateAction[] {
    const seconds = now / 1000;
    const out: CorporateAction[] = [];
    for (const mint of this.mints.values()) {
      if (mint.newMultiplierEffectiveTimestamp > seconds && mint.newMultiplier !== mint.multiplier) {
        out.push({
          symbol: mint.symbol, mint: mint.address, from: mint.multiplier, to: mint.newMultiplier,
          kind: actionKind(mint.multiplier, mint.newMultiplier), t: mint.newMultiplierEffectiveTimestamp * 1000,
        });
      }
    }
    return out.sort((a, b) => a.t - b.t);
  }

  /** The current gap to the stock price, how fresh it is, and how unusual it is for this ticker. */
  private gap(mint: string, now: number) {
    const rt = this.runtime.get(mint)!;
    const ref = this.refs.get(mint);
    const stale = !ref || now - ref.updatedAt > REF_STALE_MS;
    // Only matters while the stock trades. Outside market hours the reference does not move.
    const aging = !stale && isMarketOpen(now) && now - ref.updatedAt > REF_AGING_MS;
    const recent = rt.lastPriceT !== null && now - rt.lastPriceT <= ONCHAIN_STALE_MS;
    const premiumPct = rt.lastPrice !== null && recent && ref ? (rt.lastPrice / ref.price - 1) * 100 : null;

    // z-score of the current premium against every fresh sample since startup.
    const premiums = rt.samples.filter((s) => s.on !== null && s.ref !== null && !s.stale).map((s) => (s.on! / s.ref! - 1) * 100);
    let z: number | null = null;
    if (premiums.length >= MIN_BASELINE_SAMPLES && premiumPct !== null && !stale) {
      const mean = premiums.reduce((a, b) => a + b, 0) / premiums.length;
      const sd = Math.sqrt(premiums.reduce((a, b) => a + (b - mean) ** 2, 0) / premiums.length);
      z = sd > 1e-9 ? (premiumPct - mean) / sd : 0;
    }
    return { stale, aging, premiumPct, z, freshSamples: premiums.length };
  }

  /**
   * Re-check the "worth a look" rules. Runs on every sample tick. A condition has to hold
   * across consecutive checks for FLAG_HOLD_MS before it is listed.
   */
  private evaluateOpportunities(now: number) {
    const open = isMarketOpen(now);
    const holding = new Set<string>();
    const listed: Opportunity[] = [];
    const nearMisses: { mint: string; z: number }[] = [];

    if (open) {
      for (const mint of this.activeMints(300)) {
        const rt = this.runtime.get(mint);
        const state = this.mints.get(mint);
        if (!rt || !state || rt.lastPriceT === null || now - rt.lastPriceT > FLAG_LAST_TRADE_MS) continue;
        const { stale, aging, premiumPct, z } = this.gap(mint, now);
        if (stale || premiumPct === null || z === null) continue;
        // The stock price updates about once a minute, so it spends part of every minute over 30s
        // old. Pause on those checks: keep the hold timer and any listing, but judge nothing new.
        if (aging) {
          // Keep it on the quote list, or its quote can expire during the pause and reset the hold.
          if (this.quoteCandidates.includes(mint)) nearMisses.push({ mint, z });
          // The hold and the listing survive the pause only while a live $10K quote still lands
          // below the stock price. An expired or reversed quote drops them.
          const q10 = this.quoteNow(mint, now)?.sizes.find((size) => size.usd === 10_000) ?? null;
          if (!q10 || q10.impactPct >= 0) continue;
          if (this.flagSince.has(mint)) holding.add(mint);
          const shown = this.opportunities.find((o) => o.mint === mint);
          if (shown) listed.push({ ...shown, cost10k: q10.impactPct, route: q10.route });
          continue;
        }

        const quote = this.quoteNow(mint, now);
        const q10 = quote?.sizes.find((size) => size.usd === 10_000) ?? null;
        const below = z <= -FLAG_Z && premiumPct <= -FLAG_BELOW_MIN_PCT;
        if (!below) continue;
        // Unusual enough to be worth quoting, so the cost check has data on the next pass.
        nearMisses.push({ mint, z });
        if (!q10 || q10.impactPct >= 0) continue;
        const cost10k = q10.impactPct;

        const key = mint;
        holding.add(key);
        const since = this.flagSince.get(key) ?? now;
        this.flagSince.set(key, since);
        if (now - since < FLAG_HOLD_MS) continue;
        listed.push({ symbol: state.symbol, mint, since, premiumPct, z, cost10k, route: q10.route });
      }
    }
    for (const key of this.flagSince.keys()) if (!holding.has(key)) this.flagSince.delete(key);
    this.quoteCandidates = nearMisses.sort((a, b) => Math.abs(b.z) - Math.abs(a.z)).slice(0, 5).map((m) => m.mint);

    // Cheapest buy against the stock price first.
    this.opportunities = listed.sort((a, b) => a.cost10k - b.cost10k);
  }

  /**
   * The latest quote with each size's cost measured against the current stock price. The quote
   * can be minutes old and the stock may have moved since, so the cost stored with it can be out
   * of date. With a stale stock price, sizes are compared with the $1K quote, as in the poller.
   */
  private quoteNow(mint: string, now: number) {
    const quote = this.quotes.get(mint);
    // Tickers that leave the busiest five stop being quoted. Don't show their last quote as current.
    if (!quote || quote.sizes.length === 0 || now - quote.t >= FLAG_QUOTE_MS) return null;
    const ref = this.refs.get(mint);
    const base = ref && now - ref.updatedAt < REF_STALE_MS ? ref.price : quote.sizes[0].price;
    return { t: quote.t, sizes: quote.sizes.map((size) => ({ ...size, impactPct: (size.price / base - 1) * 100 })) };
  }

  private signal(mint: string, now: number): SignalRow {
    const state = this.mints.get(mint)!;
    const rt = this.runtime.get(mint)!;
    const ref = this.refs.get(mint);
    const { stale, aging, premiumPct, z, freshSamples } = this.gap(mint, now);

    // Volume spike: the last 5 minutes against the average 5 minutes before that, since startup.
    const baselineSec = Math.max(0, Math.min(now - this.startedAt, DAY_MS) / 1000);
    let spike: number | null = null;
    if (baselineSec >= 30 * 60) {
      let recent = 0;
      let earlier = 0;
      const from = Math.max(this.startedAt, now - DAY_MS);
      for (let i = this.events.length - 1; i >= 0; i--) {
        const event = this.events[i];
        if (event.t < from) break;
        if (event.mint !== mint || !TRADE.has(event.type) || event.usd === null) continue;
        if (event.t >= now - 5 * 60_000) recent += event.usd;
        else earlier += event.usd;
      }
      const periods = (now - 5 * 60_000 - from) / (5 * 60_000);
      const average = periods > 0 ? earlier / periods : 0;
      spike = average > 0 ? recent / average : null;
    }

    const quote = this.quoteNow(mint, now);
    return {
      symbol: state.symbol,
      onchain: rt.lastPrice,
      ref: ref?.price ?? null,
      refAgeSec: ref ? Math.max(0, Math.round((now - ref.updatedAt) / 1000)) : null,
      stale,
      aging,
      premiumPct,
      z,
      baselineSec: Math.round(Math.min(baselineSec, freshSamples * SAMPLE_SECONDS)),
      spike,
      impliedOpenPct: !this.status.marketOpen && rt.lastPrice !== null && (rt.lastSessionRef ?? ref?.price)
        ? (rt.lastPrice / (rt.lastSessionRef ?? ref!.price) - 1) * 100
        : null,
      closeMedianSec: median(rt.closeDurations),
      closeEpisodes: rt.closeDurations.length,
      slippage: quote?.sizes ?? null,
      slippageAgeSec: quote ? Math.round((now - quote.t) / 1000) : null,
    };
  }

  snapshot(params: SnapshotParams): Snapshot {
    const now = Date.now();
    const from = Math.max(this.startedAt, now - WINDOW_MS[params.window]);

    const volume = new Map<string, { usd: number; trades: number }>();
    const netMint = new Map<string, { usd: number; shares: number }>();
    const flows = { dex: 0, lending: 0, mintRedeem: 0, transfers: 0, liquidity: 0 };
    const traders = new Set<string>();
    const markers: Marker[] = [];
    let volumeUsd = 0;
    let trades = 0;
    let netMintUsd = 0;

    for (let i = this.events.length - 1; i >= 0; i--) {
      const event = this.events[i];
      // Events arrive nearly in time order. Stop a minute past the window edge.
      if (event.t < from - 60_000) break;
      if (event.t < from) continue;
      if (event.type === "mint" || event.type === "redeem") markers.push({ t: event.t, symbol: event.symbol, kind: event.type, usd: event.usd });
      const usd = event.usd ?? 0;
      if (TRADE.has(event.type)) {
        volumeUsd += usd;
        trades++;
        traders.add(event.wallet);
        flows.dex += usd;
        const entry = volume.get(event.symbol) ?? { usd: 0, trades: 0 };
        entry.usd += usd;
        entry.trades++;
        volume.set(event.symbol, entry);
      } else if (event.type === "mint" || event.type === "redeem") {
        const sign = event.type === "mint" ? 1 : -1;
        // A mint seen before the first stock price has no dollar value. Value it now instead of as $0.
        const usd = event.usd ?? this.valueShares(event.mint, event.shares);
        flows.mintRedeem += usd;
        netMintUsd += sign * usd;
        const entry = netMint.get(event.symbol) ?? { usd: 0, shares: 0 };
        entry.usd += sign * usd;
        entry.shares += sign * event.shares;
        netMint.set(event.symbol, entry);
      } else if (event.type === "transfer") flows.transfers += usd;
      else if (event.type === "lend_deposit" || event.type === "lend_withdraw") flows.lending += usd;
      else flows.liquidity += usd;
    }

    const volumeByTicker = [...volume.entries()].map(([symbol, v]) => ({ symbol, ...v })).sort((a, b) => b.usd - a.usd);

    // Premium chart: chosen tickers, or the top four by volume across all trades in the window.
    let chartSymbols = params.chart.filter((symbol) => this.bySymbol.has(symbol)).slice(0, 12);
    if (chartSymbols.length === 0) {
      const all = new Map<string, number>();
      for (let i = this.events.length - 1; i >= 0 && this.events[i].t >= from; i--) {
        const event = this.events[i];
        if (TRADE.has(event.type)) all.set(event.symbol, (all.get(event.symbol) ?? 0) + (event.usd ?? 0));
      }
      chartSymbols = [...all.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([symbol]) => symbol);
    }
    let refMaxAgeSec: number | null = null;
    const series = chartSymbols.map((symbol) => {
      const mint = this.bySymbol.get(symbol)!;
      const ref = this.refs.get(mint);
      if (ref) refMaxAgeSec = Math.max(refMaxAgeSec ?? 0, Math.round((now - ref.updatedAt) / 1000));
      const points = this.runtime.get(mint)!.samples
        .filter((s) => s.t >= from)
        .map((s): [number, number | null, 0 | 1] => [s.t, s.on !== null && s.ref !== null ? (s.on / s.ref - 1) * 100 : null, s.stale ? 1 : 0]);
      return { symbol, points: thin(points, 240) };
    });
    const chartSet = new Set(chartSymbols);
    const corpMarkers: Marker[] = this.applied.filter((a) => a.t >= from).map((a) => ({ t: a.t, symbol: a.symbol, kind: "corp", usd: null }));
    const chartMarkers = [...largestMarkers(markers.filter((m) => chartSet.has(m.symbol))), ...corpMarkers.filter((m) => chartSet.has(m.symbol))];

    // Signals for the busiest tickers.
    const signalMints = this.topMintsByVolume(from, 10);
    const signals = signalMints.map((mint) => this.signal(mint, now));

    const tickers = this.activeMints(400)
      .map((mint) => this.mints.get(mint)!)
      .map((mint) => ({ symbol: mint.symbol, name: mint.name }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    return {
      now,
      disclaimer: DISCLAIMER,
      status: this.status,
      window: { key: params.window, from, to: now, partial: this.status.gaps.some((gap) => (gap.to ?? now) >= from && !gap.replayed) },
      options: { tickers },
      kpis: { volumeUsd, trades, traders: traders.size, netMintUsd, tradedSinceStart: this.tradedMints.size },
      premium: { series, markers: chartMarkers, sessions: marketSessions(from, now), refMaxAgeSec },
      volumeByTicker,
      flows,
      // Rows under $1 net are dust, often bridge moves of a fraction of a share. Leave them out.
      netMint: [...netMint.entries()]
        .map(([symbol, v]) => ({ symbol, ...v }))
        .filter((row) => Math.abs(row.usd) >= NET_MINT_MIN_USD)
        .sort((a, b) => Math.abs(b.usd) - Math.abs(a.usd))
        .slice(0, 8),
      corporate: { upcoming: this.upcoming(now).slice(0, 30), applied: this.applied.slice(-20).reverse() },
      opportunities: this.opportunities,
      signals,
      ticker: params.page ? this.tickerDetail(params.page, from, now) : null,
    };
  }

  topMintsByVolume(from: number, limit: number): string[] {
    const totals = new Map<string, number>();
    for (let i = this.events.length - 1; i >= 0 && this.events[i].t >= from - 60_000; i--) {
      const event = this.events[i];
      if (TRADE.has(event.type)) totals.set(event.mint, (totals.get(event.mint) ?? 0) + (event.usd ?? 0));
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([mint]) => mint);
  }

  private tickerDetail(symbol: string, from: number, now: number): TickerDetail | null {
    const mint = this.bySymbol.get(symbol);
    if (!mint) return null;
    const state = this.mints.get(mint)!;
    const rt = this.runtime.get(mint)!;
    const signal = this.signal(mint, now);
    const seconds = now / 1000;

    const largest: DecodedEvent[] = [];
    const markers: Marker[] = [];
    const bucketCount = 24;
    const bucketMs = Math.max(1, (now - from) / bucketCount);
    const bars = Array.from({ length: bucketCount }, (_, i) => ({ t: from + i * bucketMs, usd: 0 }));
    let volumeUsd = 0;
    let trades = 0;
    for (let i = this.events.length - 1; i >= 0; i--) {
      const event = this.events[i];
      if (event.t < from - 60_000) break;
      if (event.t < from || event.mint !== mint) continue;
      if (event.type === "mint" || event.type === "redeem") markers.push({ t: event.t, symbol, kind: event.type, usd: event.usd });
      if (!TRADE.has(event.type)) continue;
      const usd = event.usd ?? 0;
      volumeUsd += usd;
      trades++;
      bars[Math.min(bucketCount - 1, Math.floor((event.t - from) / bucketMs))].usd += usd;
      largest.push(event);
    }
    largest.sort((a, b) => (b.usd ?? 0) - (a.usd ?? 0));
    const applied = this.applied.filter((a) => a.mint === mint);
    for (const action of applied) if (action.t >= from) markers.push({ t: action.t, symbol, kind: "corp", usd: null });

    const supplyNow = rawToShares(state, state.supplyRaw, seconds);
    const supplyStart = rt.supplySteps[0][1];
    return {
      symbol,
      name: state.name,
      mint,
      onchain: rt.lastPrice,
      onchainT: rt.lastPriceT,
      ref: signal.ref,
      refAgeSec: signal.refAgeSec,
      stale: signal.stale,
      aging: signal.aging,
      premiumPct: signal.premiumPct,
      volumeUsd,
      trades,
      supplyShares: supplyNow,
      supplyChangeShares: rawToShares(state, state.supplyRaw - rt.startSupplyRaw, seconds),
      decodedNetShares: rawToShares(state, rt.decodedNetRaw, seconds),
      multiplier: multiplierAt(state, seconds),
      upcoming: this.upcoming(now).find((a) => a.mint === mint) ?? null,
      applied,
      series: thin(
        rt.samples.filter((s) => s.t >= from).map((s): [number, number | null, number | null, number | null, 0 | 1] => [
          s.t, s.on, s.ref, s.on !== null && s.ref !== null ? (s.on / s.ref - 1) * 100 : null, s.stale ? 1 : 0,
        ]),
        300,
      ),
      markers: [...largestMarkers(markers.filter((m) => m.kind !== "corp")), ...markers.filter((m) => m.kind === "corp")],
      volumeBars: bars,
      supply: thin([[this.startedAt, supplyStart] as [number, number], ...rt.supplySteps.slice(1)], 400),
      largest: largest.slice(0, 20),
      signal,
    };
  }
}

/** The 60 largest mint and redeem markers. Corporate actions are added separately so they are never cut. */
function largestMarkers(markers: Marker[]): Marker[] {
  return [...markers].sort((a, b) => (b.usd ?? 0) - (a.usd ?? 0)).slice(0, 60);
}

/** Dividends nudge the multiplier by a fraction of a percent. Splits move it by a large ratio. */
function actionKind(from: number, to: number): "dividend" | "split" {
  const ratio = to / from;
  return ratio > 1.2 || ratio < 0.8 ? "split" : "dividend";
}
