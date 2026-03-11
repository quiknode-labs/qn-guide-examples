"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import type { L2BookState } from "@/types/orderbook";
import type { L4DiffEvent } from "@/types/orderflow";
import { DiffType } from "@/types/orderflow";

export interface Metrics {
  midPrice: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadBps: number;
  totalBidDepth: number;
  totalAskDepth: number;
  bidAskRatio: number;
  bookImbalance: number;  // -1 to +1, top 10 levels: (bidVol-askVol)/(bidVol+askVol)
  bidOrders: number;
  askOrders: number;
  flowRate: number;       // events per second (rolling 10s window)
  newOrders: number;      // count in current buffer
  filledOrders: number;
  canceledOrders: number;
}

const EMPTY: Metrics = {
  midPrice: 0,
  bestBid: 0,
  bestAsk: 0,
  spread: 0,
  spreadBps: 0,
  totalBidDepth: 0,
  totalAskDepth: 0,
  bidAskRatio: 0,
  bookImbalance: 0,
  bidOrders: 0,
  askOrders: 0,
  flowRate: 0,
  newOrders: 0,
  filledOrders: 0,
  canceledOrders: 0,
};

export function useMetrics(
  l2Data: L2BookState | null,
  l4Events: L4DiffEvent[]
): Metrics {
  // Track event timestamps for flow rate calculation
  const eventTimestampsRef = useRef<number[]>([]);
  const [flowRate, setFlowRate] = useState(0);

  // Update flow rate on a 1s interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cutoff = now - 10_000; // 10s window
      eventTimestampsRef.current = eventTimestampsRef.current.filter((t) => t > cutoff);
      setFlowRate(eventTimestampsRef.current.length / 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track new events arriving
  const prevLengthRef = useRef(0);
  useEffect(() => {
    const newCount = l4Events.length - prevLengthRef.current;
    if (newCount > 0) {
      const now = Date.now();
      for (let i = 0; i < Math.min(newCount, 50); i++) {
        eventTimestampsRef.current.push(now);
      }
    }
    prevLengthRef.current = l4Events.length;
  }, [l4Events.length]);

  // Reset on coin change (events get cleared to 0)
  useEffect(() => {
    if (l4Events.length === 0) {
      prevLengthRef.current = 0;
      eventTimestampsRef.current = [];
      setFlowRate(0);
    }
  }, [l4Events.length]);

  const derived = useMemo(() => {
    if (!l2Data || l2Data.bids.length === 0 || l2Data.asks.length === 0) {
      return EMPTY;
    }

    const bestBid = l2Data.bids[0].pxFloat;
    const bestAsk = l2Data.asks[0].pxFloat;
    const midPrice = (bestBid + bestAsk) / 2;
    const spread = bestAsk - bestBid;
    const spreadBps = midPrice > 0 ? (spread / midPrice) * 10_000 : 0;

    let totalBidDepth = 0;
    let bidOrders = 0;
    for (const level of l2Data.bids) {
      totalBidDepth += level.szFloat;
      bidOrders += level.n;
    }

    let totalAskDepth = 0;
    let askOrders = 0;
    for (const level of l2Data.asks) {
      totalAskDepth += level.szFloat;
      askOrders += level.n;
    }

    const bidAskRatio = totalAskDepth > 0 ? totalBidDepth / totalAskDepth : 0;

    // Book imbalance: top 10 levels
    let topBidVol = 0;
    let topAskVol = 0;
    const imbalanceLevels = 10;
    for (let i = 0; i < Math.min(imbalanceLevels, l2Data.bids.length); i++) {
      topBidVol += l2Data.bids[i].szFloat;
    }
    for (let i = 0; i < Math.min(imbalanceLevels, l2Data.asks.length); i++) {
      topAskVol += l2Data.asks[i].szFloat;
    }
    const totalTopVol = topBidVol + topAskVol;
    const bookImbalance = totalTopVol > 0 ? (topBidVol - topAskVol) / totalTopVol : 0;

    // Count L4 event types
    let newOrders = 0;
    let filledOrders = 0;
    let canceledOrders = 0;
    for (const ev of l4Events) {
      if (ev.type === DiffType.NEW) newOrders++;
      else if (ev.type === DiffType.FILLED) filledOrders++;
      else if (ev.type === DiffType.CANCELED) canceledOrders++;
    }

    return {
      midPrice,
      bestBid,
      bestAsk,
      spread,
      spreadBps,
      totalBidDepth,
      totalAskDepth,
      bidAskRatio,
      bookImbalance,
      bidOrders,
      askOrders,
      newOrders,
      filledOrders,
      canceledOrders,
    };
  }, [l2Data, l4Events]);

  return { ...derived, flowRate };
}
