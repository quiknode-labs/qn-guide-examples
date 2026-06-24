import {
  BboBookUpdate,
  BboState,
  ClientState,
  ClusterBucket,
  RecentEvent,
  RunMode,
  TpslDiffType,
  TpslOrderDiff,
  TpslUpdatesUpdate,
} from '../shared/types';

interface StoredOrder {
  oid: string;
  coin: string;
  side: 'buy' | 'sell';
  triggerPx: number;
  orderType: string;
  timestamp: number;
  notional: number | null;
  positionSized: boolean;
  isTakeProfit: boolean;
}

interface MutableBucket {
  coin: string;
  price: number;
  totalNotional: number;
  tpCount: number;
  slCount: number;
  positionSizedCount: number;
  knownOrderCount: number;
  buyCount: number;
  sellCount: number;
}

export class ClusterStore {
  private readonly orders = new Map<string, Map<string, StoredOrder>>();
  private readonly bbo = new Map<string, BboState>();
  private readonly events = new Map<string, RecentEvent[]>();

  constructor(
    private readonly coins: string[],
    private readonly defaultCoin: string,
    private readonly bucketSizePct: number
  ) {
    for (const coin of coins) {
      this.orders.set(coin, new Map());
      this.events.set(coin, []);
    }
  }

  applyBbo(update: BboBookUpdate): void {
    const bid = update.bid ? Number(update.bid.px) : null;
    const ask = update.ask ? Number(update.ask.px) : null;
    const mid = bid !== null && ask !== null ? (bid + ask) / 2 : null;
    const spreadBps = bid !== null && ask !== null && bid > 0 ? ((ask - bid) / bid) * 10_000 : null;

    this.bbo.set(update.coin, {
      coin: update.coin,
      bid,
      ask,
      bidSize: update.bid ? Number(update.bid.sz) : null,
      askSize: update.ask ? Number(update.ask.sz) : null,
      spreadBps,
      mid,
      updatedAt: Number(update.time || Date.now()),
      blockNumber: String(update.block_number || ''),
    });
  }

  applyTpslUpdate(update: TpslUpdatesUpdate): void {
    if (update.snapshot) {
      const resetCoins = this.coins.length > 0 ? this.coins : [...new Set(update.diffs.map((diff) => diff.coin))];
      for (const coin of resetCoins) this.clearCoin(coin);
    }

    for (const diff of update.diffs || []) {
      if (diff.diff_type === TpslDiffType.ADD) this.addOrder(diff);
      if (diff.diff_type === TpslDiffType.REMOVE) this.removeOrder(diff);
    }
  }

  clearTpslState(): void {
    const knownCoins = new Set([...this.coins, ...this.orders.keys(), ...this.events.keys()]);
    for (const coin of knownCoins) this.clearCoin(coin);
  }

  addOrder(diff: TpslOrderDiff): void {
    const order = this.toStoredOrder(diff);
    if (!order) return;

    this.ensureOrders(order.coin).set(order.oid, order);
    this.pushEvent(order, 'ADD');
  }

  removeOrder(diff: TpslOrderDiff): void {
    const coinOrders = this.ensureOrders(diff.coin);
    const existing = coinOrders.get(String(diff.oid));
    const derived = this.toStoredOrder(diff);
    const eventOrder = existing ?? derived;

    if (existing) coinOrders.delete(existing.oid);
    if (eventOrder) {
      this.pushEvent(eventOrder, diff.reason === 'filled' ? 'TRIGGERED' : 'REMOVED', diff.reason);
    }
  }

  toClientState(mode: RunMode, status: string): ClientState {
    const bbo: ClientState['bbo'] = {};
    const buckets: ClientState['buckets'] = {};
    const recentEvents: ClientState['recentEvents'] = {};
    const bucketSizeByCoin: ClientState['bucketSizeByCoin'] = {};

    for (const coin of this.coins) {
      bbo[coin] = this.bbo.get(coin);
      buckets[coin] = this.getBuckets(coin);
      bucketSizeByCoin[coin] = this.bucketSizeForCoin(coin);
      recentEvents[coin] = this.events.get(coin) ?? [];
    }

    return {
      kind: 'state',
      mode,
      status,
      generatedAt: Date.now(),
      coins: this.coins,
      defaultCoin: this.defaultCoin,
      bucketSizePct: this.bucketSizePct,
      bucketSizeByCoin,
      bbo,
      buckets,
      recentEvents,
    };
  }

  private clearCoin(coin: string): void {
    this.orders.set(coin, new Map());
    this.events.set(coin, []);
  }

  private ensureOrders(coin: string): Map<string, StoredOrder> {
    if (!this.orders.has(coin)) this.orders.set(coin, new Map());
    return this.orders.get(coin)!;
  }

  private toStoredOrder(diff: TpslOrderDiff): StoredOrder | null {
    const triggerPx = Number(diff.trigger_px);
    if (!Number.isFinite(triggerPx) || triggerPx <= 0) return null;

    const size = Number(diff.sz);
    const positionSized = diff.is_position_tpsl || size === 0;
    const side = diff.side === 'B' ? 'buy' : 'sell';
    const isTakeProfit = this.isTakeProfit(diff.order_type);
    const notional = positionSized || !Number.isFinite(size) ? null : triggerPx * size;

    return {
      oid: String(diff.oid),
      coin: diff.coin,
      side,
      triggerPx,
      orderType: diff.order_type || 'Trigger order',
      timestamp: Number(diff.timestamp || Date.now()),
      notional,
      positionSized,
      isTakeProfit,
    };
  }

  private getBuckets(coin: string): ClusterBucket[] {
    const bucketSize = this.bucketSizeForCoin(coin);
    const bucketMap = new Map<string, MutableBucket>();

    for (const order of this.orders.get(coin)?.values() ?? []) {
      const price = this.bucket(order.triggerPx, bucketSize);
      const key = this.bucketKey(price, bucketSize);
      const bucket = bucketMap.get(key) ?? {
        coin,
        price,
        totalNotional: 0,
        tpCount: 0,
        slCount: 0,
        positionSizedCount: 0,
        knownOrderCount: 0,
        buyCount: 0,
        sellCount: 0,
      };

      if (order.notional === null) bucket.positionSizedCount += 1;
      else {
        bucket.totalNotional += order.notional;
        bucket.knownOrderCount += 1;
      }
      if (order.isTakeProfit) bucket.tpCount += 1;
      else bucket.slCount += 1;
      if (order.side === 'buy') bucket.buyCount += 1;
      else bucket.sellCount += 1;
      bucketMap.set(key, bucket);
    }

    return [...bucketMap.values()]
      .map((bucket) => ({
        ...bucket,
        totalNotional: Math.round(bucket.totalNotional),
        label: this.formatPrice(bucket.price, bucketSize),
      }))
      .sort((a, b) => b.price - a.price);
  }

  private pushEvent(order: StoredOrder, type: RecentEvent['type'], reason?: string): void {
    const list = this.events.get(order.coin) ?? [];
    list.unshift({
      id: `${order.oid}-${type}-${Date.now()}`,
      coin: order.coin,
      oid: order.oid,
      type,
      orderType: order.orderType,
      side: order.side,
      triggerPx: order.triggerPx,
      notional: order.notional,
      positionSized: order.positionSized,
      reason,
      timestamp: Date.now(),
    });
    this.events.set(order.coin, list.slice(0, 40));
  }

  private bucketSizeForCoin(coin: string): number {
    const mid = this.bbo.get(coin)?.mid;
    const orders = [...(this.orders.get(coin)?.values() ?? [])];
    const fallbackPrice =
      orders.length > 0 ? orders.reduce((sum, order) => sum + order.triggerPx, 0) / orders.length : 100;
    const referencePrice = mid && Number.isFinite(mid) ? mid : fallbackPrice;
    return this.niceBucketSize(referencePrice * (this.bucketSizePct / 100));
  }

  private bucket(price: number, bucketSize: number): number {
    return Math.round(price / bucketSize) * bucketSize;
  }

  private bucketKey(price: number, bucketSize: number): string {
    return price.toFixed(bucketSize < 1 ? 3 : bucketSize < 10 ? 2 : 0);
  }

  private formatPrice(price: number, bucketSize: number): string {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: bucketSize < 1 ? 3 : bucketSize < 10 ? 2 : 0,
      maximumFractionDigits: bucketSize < 1 ? 3 : bucketSize < 10 ? 2 : 0,
    });
  }

  private niceBucketSize(rawSize: number): number {
    if (!Number.isFinite(rawSize) || rawSize <= 0) return 1;
    const exponent = Math.floor(Math.log10(rawSize));
    const base = 10 ** exponent;
    const normalized = rawSize / base;
    const steps = [1, 2, 2.5, 5, 10];
    const nearest = steps.reduce((best, step) =>
      Math.abs(step - normalized) < Math.abs(best - normalized) ? step : best
    );
    return nearest * base;
  }

  private isTakeProfit(orderType: string): boolean {
    const normalized = orderType.toLowerCase();
    return normalized.includes('take profit') || normalized.includes('tp');
  }
}
