import { useEffect, useMemo, useState } from "react";
import { Loader, Message } from "./ui.tsx";
import type { SnapshotParams, WindowKey } from "../../shared/types.ts";
import { EXCHANGE_NOTE, TopBar } from "./components/shared.tsx";
import { useTick } from "./components/charts.tsx";
import { Main } from "./pages/Main.tsx";
import { Startup } from "./pages/Startup.tsx";
import { Ticker } from "./pages/Ticker.tsx";
import { useSnapshot } from "./useSnapshot.ts";

export interface Controls {
  window: WindowKey;
  chart: string[];
}

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const match = hash.match(/^#\/t\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function App() {
  const page = useHashRoute();
  const [controls, setControls] = useState<Controls>({ window: "15m", chart: [] });
  useTick(1000);

  const params: SnapshotParams = useMemo(
    () => ({
      window: controls.window,
      chart: controls.chart,
      page,
    }),
    [controls, page],
  );
  const { snapshot, serverDown } = useSnapshot(params);


  if (!snapshot) {
    return (
      <div data-theme="gray" className="flex min-h-screen items-center justify-center gap-3 bg-(--background) text-(--foreground)">
        {serverDown ? (
          <Message variant="error" title="No connection to the app server." description="Start it with npm run dev, then this page reconnects." />
        ) : (
          <Loader size="base" label="Connecting to the app server" />
        )}
      </div>
    );
  }

  const { status } = snapshot;
  return (
    <div data-theme="gray" className="min-h-screen bg-(--background) text-(--foreground)">
      <TopBar snapshot={snapshot} />
      <div className="border-b border-(--border)">
        <p className="mx-auto my-0 max-w-[1440px] px-6 py-2 text-xs text-(--foreground-medium)">
          {snapshot.disclaimer} {EXCHANGE_NOTE}
        </p>
      </div>
      {status.phase === "starting" ? (
        <Startup snapshot={snapshot} />
      ) : (
        <main className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-5">
          {serverDown ? <Message variant="error" title="Lost the app server." description="Numbers on this page are frozen until it comes back." /> : null}
          {status.phase === "reconnecting" && status.reconnect ? (
            <Message
              variant="warning"
              title="Reconnecting."
              description={`Stream disconnected. Retrying in ${Math.max(0, Math.ceil((status.reconnect.retryAt - Date.now()) / 1000))}s (attempt ${status.reconnect.attempt}). Charts mark the gap.`}
            />
          ) : null}
          {page ? (
            <Ticker snapshot={snapshot} symbol={page} controls={controls} setControls={setControls} />
          ) : (
            <Main snapshot={snapshot} controls={controls} setControls={setControls} />
          )}
        </main>
      )}
    </div>
  );
}
