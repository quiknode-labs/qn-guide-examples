"use client";

import { useState, useEffect } from "react";
import { getTitanProviders, getTitanVenues, getTitanInfo } from "@/lib/titan";
import type { TitanProvider, TitanVenues, TitanInfo } from "@/lib/types";

/**
 * Loads the static-ish Titan metadata once: the competing providers, the
 * routable on-chain venues (with program ids), and server info. These describe
 * the breadth of the meta-aggregation and rarely change within a session.
 */
export function useTitanMeta() {
  const [providers, setProviders] = useState<TitanProvider[]>([]);
  const [venues, setVenues] = useState<TitanVenues>({ labels: [], programIds: [] });
  const [info, setInfo] = useState<TitanInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled([
        getTitanProviders(),
        getTitanVenues(),
        getTitanInfo(),
      ]);
      if (cancelled) return;

      if (results[0].status === "fulfilled") setProviders(results[0].value);
      if (results[1].status === "fulfilled") setVenues(results[1].value);
      if (results[2].status === "fulfilled") setInfo(results[2].value);

      const failed = results.find((r) => r.status === "rejected");
      if (failed && failed.status === "rejected") {
        setError(
          failed.reason instanceof Error
            ? failed.reason.message
            : "Failed to load Titan metadata"
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { providers, venues, info, error };
}
