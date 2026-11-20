import { useEffect, useState } from "react";
import type { Snapshot, SnapshotParams } from "../../shared/types.ts";

/** Subscribe to the server's SSE feed. The query string carries the filters, so a change reconnects. */
export function useSnapshot(params: SnapshotParams): { snapshot: Snapshot | null; serverDown: boolean } {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [serverDown, setServerDown] = useState(false);
  const query = new URLSearchParams({
    window: params.window,
    chart: params.chart.join(","),
    page: params.page,
  }).toString();

  useEffect(() => {
    const source = new EventSource(`/api/events?${query}`);
    source.onmessage = (message) => {
      setServerDown(false);
      setSnapshot(JSON.parse(message.data) as Snapshot);
    };
    source.onerror = () => setServerDown(true);
    return () => source.close();
  }, [query]);

  return { snapshot, serverDown };
}

export function useStored<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const update = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage is a convenience. The page works without it.
    }
  };
  return [value, update];
}
