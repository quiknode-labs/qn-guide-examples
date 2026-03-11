"use client";

import { useMemo } from "react";
import type { L2BookState, L2Level } from "@/types/orderbook";

export interface L2LevelEnriched extends L2Level {
  cumulative: number;
}

interface UseOrderbookResult {
  spread: number;
  spreadBps: number;
  midPrice: number;
  maxSize: number;
  bidsEnriched: L2LevelEnriched[];
  asksEnriched: L2LevelEnriched[];
}

export function useOrderbook(data: L2BookState | null): UseOrderbookResult {
  return useMemo(() => {
    if (!data || data.bids.length === 0 || data.asks.length === 0) {
      return {
        spread: 0,
        spreadBps: 0,
        midPrice: 0,
        maxSize: 0,
        bidsEnriched: [],
        asksEnriched: [],
      };
    }

    const bestBid = data.bids[0].pxFloat;
    const bestAsk = data.asks[0].pxFloat;
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    const spreadBps = midPrice > 0 ? (spread / midPrice) * 10_000 : 0;

    // Max individual size across both sides drives bar width
    let maxSize = 0;
    for (const level of data.bids) {
      if (level.szFloat > maxSize) maxSize = level.szFloat;
    }
    for (const level of data.asks) {
      if (level.szFloat > maxSize) maxSize = level.szFloat;
    }

    let bidCum = 0;
    const bidsEnriched: L2LevelEnriched[] = data.bids.map((level) => {
      bidCum += level.szFloat;
      return { ...level, cumulative: bidCum };
    });

    let askCum = 0;
    const asksEnriched: L2LevelEnriched[] = data.asks.map((level) => {
      askCum += level.szFloat;
      return { ...level, cumulative: askCum };
    });

    return {
      spread,
      spreadBps,
      midPrice,
      maxSize,
      bidsEnriched,
      asksEnriched,
    };
  }, [data]);
}
