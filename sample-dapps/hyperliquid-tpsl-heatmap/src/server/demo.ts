import { TpslDiffType, TpslOrderDiff } from '../shared/types';
import { ClusterStore } from './cluster-store';

const basePrices: Record<string, number> = {
  BTC: 64000,
  ETH: 3400,
  SOL: 140,
  HYPE: 38,
};

export function startDemoFeed(coins: string[], store: ClusterStore, broadcast: (status: string) => void): void {
  const prices = new Map(coins.map((coin) => [coin, basePrices[coin] ?? 100]));
  const openOrders = new Map<string, TpslOrderDiff[]>();
  let oid = 90_000_000;

  for (const coin of coins) {
    openOrders.set(coin, []);
    for (let i = 0; i < 26; i++) {
      const diff = makeAdd(coin, prices.get(coin)!, oid++);
      openOrders.get(coin)!.push(diff);
      store.addOrder(diff);
    }
    pushBbo(coin, prices.get(coin)!, store);
  }
  broadcast('Demo feed running');

  setInterval(() => {
    for (const coin of coins) {
      const previous = prices.get(coin)!;
      const next = previous * (1 + (Math.random() - 0.5) * 0.0014);
      prices.set(coin, next);
      pushBbo(coin, next, store);

      const orders = openOrders.get(coin)!;
      if (orders.length > 8 && Math.random() > 0.48) {
        const index = Math.floor(Math.random() * orders.length);
        const removed = orders.splice(index, 1)[0];
        store.removeOrder({
          ...removed,
          diff_type: TpslDiffType.REMOVE,
          reason: Math.random() > 0.62 ? 'filled' : 'cancelled',
        });
      }

      if (Math.random() > 0.3) {
        const added = makeAdd(coin, next, oid++);
        orders.push(added);
        store.addOrder(added);
      }
    }
    broadcast('Demo feed running');
  }, 900);
}

function pushBbo(coin: string, mid: number, store: ClusterStore): void {
  const spread = mid * 0.00012;
  store.applyBbo({
    coin,
    time: String(Date.now()),
    block_number: String(Math.floor(Date.now() / 1000)),
    bid: { px: (mid - spread / 2).toFixed(priceDecimals(mid)), sz: (Math.random() * 2).toFixed(4), n: 1 },
    ask: { px: (mid + spread / 2).toFixed(priceDecimals(mid)), sz: (Math.random() * 2).toFixed(4), n: 1 },
  });
}

function makeAdd(coin: string, mid: number, oid: number): TpslOrderDiff {
  const above = Math.random() > 0.5;
  const distance = 0.002 + Math.random() * 0.045;
  const triggerPx = mid * (above ? 1 + distance : 1 - distance);
  const takeProfit = above ? Math.random() > 0.35 : Math.random() > 0.68;
  const positionSized = Math.random() > 0.82;
  const size = positionSized ? '0.0' : demoSize(coin);
  const px = triggerPx.toFixed(priceDecimals(triggerPx));

  return {
    diff_type: TpslDiffType.ADD,
    oid: String(oid),
    coin,
    user: '0xDemo000000000000000000000000000000000000',
    side: above ? 'A' : 'B',
    trigger_px: px,
    limit_px: px,
    sz: size,
    trigger_condition: `Price ${above ? 'above' : 'below'} ${px}`,
    order_type: takeProfit ? (Math.random() > 0.5 ? 'Take Profit Market' : 'Take Profit Limit') : 'Stop Market',
    is_position_tpsl: positionSized,
    reduce_only: true,
    timestamp: String(Date.now()),
  };
}

function demoSize(coin: string): string {
  if (coin === 'BTC') return (0.01 + Math.random() * 0.45).toFixed(4);
  if (coin === 'ETH') return (0.2 + Math.random() * 7).toFixed(3);
  if (coin === 'SOL') return (8 + Math.random() * 160).toFixed(2);
  return (1 + Math.random() * 80).toFixed(2);
}

function priceDecimals(price: number): number {
  if (price > 1000) return 1;
  if (price > 10) return 2;
  return 4;
}
