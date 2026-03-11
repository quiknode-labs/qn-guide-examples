"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { L2BookState } from "@/types/orderbook";
import type { StreamStatus } from "@/types/stream";

const DEBOUNCE_MS = 600;

interface UseL2StreamResult {
  data: L2BookState | null;
  prevData: L2BookState | null;
  status: StreamStatus;
  blockNumber: string;
}

export function useL2Stream(coin: string, levels = 30): UseL2StreamResult {
  const [data, setData] = useState<L2BookState | null>(null);
  const [status, setStatus] = useState<StreamStatus>("connecting");
  const [blockNumber, setBlockNumber] = useState("");
  const prevDataRef = useRef<L2BookState | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const hasReceivedDataRef = useRef(false);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus("connecting");
    setData(null);
    prevDataRef.current = null;
    hasReceivedDataRef.current = false;

    const es = new EventSource(`/api/stream/l2?coin=${coin}&levels=${levels}`);
    eventSourceRef.current = es;

    es.addEventListener("l2update", (e) => {
      hasReceivedDataRef.current = true;
      const update = JSON.parse(e.data);
      setData((prev) => {
        prevDataRef.current = prev;
        return {
          coin: update.coin,
          time: update.time,
          blockNumber: update.blockNumber,
          bids: update.bids.map((l: any) => ({
            ...l,
            pxFloat: parseFloat(l.px),
            szFloat: parseFloat(l.sz),
          })),
          asks: update.asks.map((l: any) => ({
            ...l,
            pxFloat: parseFloat(l.px),
            szFloat: parseFloat(l.sz),
          })),
        };
      });
      setBlockNumber(update.blockNumber);
      setStatus("connected");
    });

    es.addEventListener("reconnecting", () => {
      setStatus("reconnecting");
    });

    es.addEventListener("error", () => {
      setStatus("error");
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setStatus("disconnected");
      } else if (hasReceivedDataRef.current) {
        setStatus("reconnecting");
      }
    };
  }, [coin, levels]);

  useEffect(() => {
    // Debounce: wait for coin to settle before opening connection
    const timer = setTimeout(() => {
      connect();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return { data, prevData: prevDataRef.current, status, blockNumber };
}
