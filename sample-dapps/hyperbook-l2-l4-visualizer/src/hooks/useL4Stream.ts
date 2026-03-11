"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { L4DiffEvent, L4SnapshotInfo } from "@/types/orderflow";
import type { StreamStatus } from "@/types/stream";
import { MAX_L4_EVENTS } from "@/lib/constants";

const DEBOUNCE_MS = 600;

interface UseL4StreamResult {
  feedEvents: L4DiffEvent[];
  snapshotInfo: L4SnapshotInfo | null;
  status: StreamStatus;
}

export function useL4Stream(coin: string): UseL4StreamResult {
  const [feedEvents, setFeedEvents] = useState<L4DiffEvent[]>([]);
  const [snapshotInfo, setSnapshotInfo] = useState<L4SnapshotInfo | null>(null);
  const [status, setStatus] = useState<StreamStatus>("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingEventsRef = useRef<L4DiffEvent[]>([]);
  const rafRef = useRef<number | null>(null);
  const hasReceivedDataRef = useRef(false);

  const flushEvents = useCallback(() => {
    const pending = pendingEventsRef.current;
    if (pending.length === 0) return;

    pendingEventsRef.current = [];
    setFeedEvents((prev) => {
      const next = [...pending, ...prev];
      return next.slice(0, MAX_L4_EVENTS);
    });
    rafRef.current = null;
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus("connecting");
    setFeedEvents([]);
    setSnapshotInfo(null);
    pendingEventsRef.current = [];
    hasReceivedDataRef.current = false;

    const es = new EventSource(`/api/stream/l4?coin=${coin}`);
    eventSourceRef.current = es;

    es.addEventListener("l4snapshot", (e) => {
      hasReceivedDataRef.current = true;
      const snap = JSON.parse(e.data);
      setSnapshotInfo({
        coin: snap.coin,
        height: snap.height,
        bidCount: snap.bidCount,
        askCount: snap.askCount,
        topBid: snap.topBid,
        topAsk: snap.topAsk,
      });
      setStatus("connected");
    });

    es.addEventListener("l4diff", (e) => {
      hasReceivedDataRef.current = true;
      const { events } = JSON.parse(e.data);
      setStatus("connected");

      pendingEventsRef.current = [...events, ...pendingEventsRef.current];
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushEvents);
      }
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
  }, [coin, flushEvents]);

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
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [connect]);

  return { feedEvents, snapshotInfo, status };
}
