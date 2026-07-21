import type { L4Checkpoint, L4SnapshotOrder } from "../checkpoint/l4-grpc.js";
import type { Side } from "../data/types.js";
import {
  formatDecimal,
  parseDecimal,
  type Decimal,
} from "./decimal.js";

export interface RestingOrder {
  oid: string;
  user: string;
  coin: string;
  side: Side;
  px: Decimal;
  sz: Decimal;
}

export interface L2Level {
  px: string;
  sz: string;
  n: number;
}

export interface L2Snapshot {
  bids: L2Level[];
  asks: L2Level[];
}

function orderFromCheckpoint(order: L4SnapshotOrder): RestingOrder {
  return {
    oid: order.oid,
    user: order.user.toLowerCase(),
    coin: order.coin,
    side: order.side,
    px: parseDecimal(order.limit_px),
    sz: parseDecimal(order.sz),
  };
}

export class OrderBook {
  readonly #orders = new Map<string, RestingOrder>();

  constructor(orders: Iterable<RestingOrder> = []) {
    for (const order of orders) this.add(order);
  }

  static fromCheckpoint(checkpoint: L4Checkpoint): OrderBook {
    return new OrderBook(
      [...checkpoint.bids, ...checkpoint.asks].map(orderFromCheckpoint),
    );
  }

  get size(): number {
    return this.#orders.size;
  }

  get(oid: number | string): RestingOrder | undefined {
    return this.#orders.get(String(oid));
  }

  add(order: RestingOrder): void {
    if (order.sz < 0n) throw new Error(`Negative size for oid ${order.oid}`);
    if (order.px <= 0n) throw new Error(`Non-positive price for oid ${order.oid}`);
    if (this.#orders.has(order.oid)) {
      throw new Error(`Duplicate resting order oid ${order.oid}`);
    }
    this.#orders.set(order.oid, { ...order });
  }

  setSize(oid: number | string, size: Decimal): void {
    const key = String(oid);
    const order = this.#orders.get(key);
    if (!order) throw new Error(`Cannot update unknown oid ${key}`);
    if (size < 0n) throw new Error(`Negative size for oid ${key}`);
    order.sz = size;
  }

  remove(oid: number | string): RestingOrder {
    const key = String(oid);
    const order = this.#orders.get(key);
    if (!order) throw new Error(`Cannot remove unknown oid ${key}`);
    this.#orders.delete(key);
    return order;
  }

  clone(): OrderBook {
    return new OrderBook(this.#orders.values());
  }

  toL2(limit?: number): L2Snapshot {
    const bids = new Map<Decimal, { sz: Decimal; n: number }>();
    const asks = new Map<Decimal, { sz: Decimal; n: number }>();
    for (const order of this.#orders.values()) {
      if (order.sz === 0n) continue;
      const levels = order.side === "B" ? bids : asks;
      const level = levels.get(order.px) ?? { sz: 0n, n: 0 };
      level.sz += order.sz;
      level.n += 1;
      levels.set(order.px, level);
    }

    const render = (
      levels: Map<Decimal, { sz: Decimal; n: number }>,
      descending: boolean,
    ): L2Level[] => {
      const entries = [...levels.entries()].sort(([a], [b]) =>
        a === b ? 0 : descending ? (a > b ? -1 : 1) : a < b ? -1 : 1,
      );
      return entries.slice(0, limit).map(([px, level]) => ({
        px: formatDecimal(px),
        sz: formatDecimal(level.sz),
        n: level.n,
      }));
    };

    return { bids: render(bids, true), asks: render(asks, false) };
  }

  assertUncrossed(): void {
    const snapshot = this.toL2(1);
    const bid = snapshot.bids[0];
    const ask = snapshot.asks[0];
    if (bid && ask && parseDecimal(bid.px) >= parseDecimal(ask.px)) {
      throw new Error(`Crossed L2 book: best bid ${bid.px}, best ask ${ask.px}`);
    }
  }

  fingerprint(): string {
    return [...this.#orders.values()]
      .sort((a, b) => a.oid.localeCompare(b.oid))
      .map(
        (order) =>
          `${order.oid}|${order.user}|${order.coin}|${order.side}|${formatDecimal(order.px)}|${formatDecimal(order.sz)}`,
      )
      .join("\n");
  }
}
