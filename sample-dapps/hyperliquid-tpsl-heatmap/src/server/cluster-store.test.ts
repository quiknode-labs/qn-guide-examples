import { describe, expect, it } from 'vitest';
import { ClusterStore } from './cluster-store';
import { TpslDiffType, TpslOrderDiff } from '../shared/types';

function diff(overrides: Partial<TpslOrderDiff> = {}): TpslOrderDiff {
  return {
    diff_type: TpslDiffType.ADD,
    oid: '1',
    coin: 'BTC',
    user: '0xabc',
    side: 'A',
    trigger_px: '64002',
    limit_px: '64002',
    sz: '0.5',
    trigger_condition: 'Price above 64002',
    order_type: 'Take Profit Market',
    is_position_tpsl: false,
    reduce_only: true,
    timestamp: String(Date.now()),
    ...overrides,
  };
}

describe('ClusterStore', () => {
  it('adds TP/SL notional into rounded buckets', () => {
    const store = new ClusterStore(['BTC'], 'BTC', 0.75);
    store.addOrder(diff());

    const state = store.toClientState('demo', 'test');
    expect(state.buckets.BTC?.[0]).toMatchObject({
      price: 64000,
      totalNotional: 32001,
      tpCount: 1,
      slCount: 0,
      knownOrderCount: 1,
    });
  });

  it('removes known orders by oid without making negative buckets', () => {
    const store = new ClusterStore(['BTC'], 'BTC', 0.75);
    store.addOrder(diff());
    store.removeOrder(diff({ diff_type: TpslDiffType.REMOVE, reason: 'filled' }));

    const state = store.toClientState('demo', 'test');
    expect(state.buckets.BTC).toEqual([]);
    expect(state.recentEvents.BTC?.[0]).toMatchObject({ type: 'TRIGGERED', reason: 'filled' });
  });

  it('counts position-sized orders but excludes them from notional', () => {
    const store = new ClusterStore(['BTC'], 'BTC', 0.75);
    store.addOrder(diff({ oid: '2', sz: '0.0', is_position_tpsl: true, order_type: 'Stop Market' }));

    const state = store.toClientState('demo', 'test');
    expect(state.buckets.BTC?.[0]).toMatchObject({
      totalNotional: 0,
      slCount: 1,
      positionSizedCount: 1,
      knownOrderCount: 0,
    });
  });

  it('snapshot updates rebuild existing state', () => {
    const store = new ClusterStore(['BTC'], 'BTC', 0.75);
    store.addOrder(diff({ oid: 'old', trigger_px: '63000' }));
    store.applyTpslUpdate({
      time: String(Date.now()),
      height: '1',
      snapshot: true,
      diffs: [diff({ oid: 'new', trigger_px: '65000' })],
    });

    const state = store.toClientState('demo', 'test');
    expect(state.buckets.BTC).toHaveLength(1);
    expect(state.buckets.BTC?.[0].price).toBe(65000);
  });
});
