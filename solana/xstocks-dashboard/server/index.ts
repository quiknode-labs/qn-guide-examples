import { createServer, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { config, REGISTRY_REFRESH_MS, SAMPLE_SECONDS } from "./config.ts";
import { startPricePolling, startQuotePolling } from "./prices.ts";
import { discoverMints, readMintStates } from "./registry.ts";
import { Store } from "./store.ts";
import { StreamManager, buildRequest } from "./stream.ts";
import { loadVenueLabels } from "./venues.ts";
import type { SnapshotParams, WindowKey } from "../shared/types.ts";

const store = new Store();
const streams = new StreamManager(store);

// ---- startup ----------------------------------------------------------------------------------

async function startup() {
  await loadVenueLabels();

  const { addresses, source } = await discoverMints();
  store.status.registrySource = source;
  store.step("registry", { state: "done", detail: `${addresses.length} found` });
  console.log(`[registry] ${addresses.length} candidate mints from ${source}`);

  store.step("state", { state: "active", detail: `0 / ${addresses.length}` });
  const states = await readMintStates(addresses, (done, total) => store.step("state", { detail: `${done} / ${total}` }));
  store.setMints(states);
  store.step("state", { state: "done", detail: `${states.size} / ${addresses.length}` });
  console.log(`[registry] ${states.size} xStocks mints tracked`);

  store.step("filters", { state: "active" });
  const { filter } = buildRequest(store.mints.keys());
  store.step("filters", { state: "done", detail: `2 filters, ${(filter.toProto().data.length / 1024).toFixed(0)} KiB each` });

  store.step("stream", { state: "active" });
  await startPricePolling(store);
  startQuotePolling(store);
  setInterval(() => store.sample(), SAMPLE_SECONDS * 1000);
  setInterval(refreshRegistry, REGISTRY_REFRESH_MS);
  void streams.run();
}

/** Re-run discovery so new listings appear without a restart. Rebuild both filters when the set grows. */
async function refreshRegistry() {
  try {
    const { addresses } = await discoverMints();
    const unknown = addresses.filter((address) => !store.mints.has(address));
    if (unknown.length === 0) return;
    const added = store.setMints(await readMintStates(unknown));
    if (added.length > 0) {
      console.log(`[registry] ${added.length} new mints`);
      streams.resubscribe();
    }
  } catch (error) {
    console.warn(`[registry] refresh failed: ${(error as Error).message}`);
  }
}

// ---- HTTP -------------------------------------------------------------------------------------

function parseParams(url: URL): SnapshotParams {
  const list = (key: string) => (url.searchParams.get(key) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const window = url.searchParams.get("window");
  return {
    window: (["15m", "1h", "all"].includes(window ?? "") ? window : "15m") as WindowKey,
    chart: list("chart").slice(0, 12),
    page: url.searchParams.get("page") ?? "",
  };
}

function serveEvents(url: URL, response: ServerResponse) {
  const params = parseParams(url);
  response.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
  });
  const push = () => response.write(`data: ${JSON.stringify(store.snapshot(params))}\n\n`);
  push();
  const timer = setInterval(push, 2_000);
  response.on("close", () => clearInterval(timer));
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".png": "image/png",
};
const DIST = join(import.meta.dirname, "..", "dist");

async function serveStatic(pathname: string, response: ServerResponse) {
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  for (const candidate of [join(DIST, safe), join(DIST, "index.html")]) {
    try {
      const body = await readFile(candidate);
      response.writeHead(200, { "content-type": MIME[extname(candidate)] ?? "application/octet-stream" });
      response.end(body);
      return;
    } catch {
      // Try the next candidate.
    }
  }
  response.writeHead(404).end("Run `npm run dev` for the UI, or `npm run build` first.");
}

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname === "/api/events") return serveEvents(url, response);
  if (url.pathname === "/api/health") {
    response.writeHead(200, { "content-type": "application/json" });
    return response.end(JSON.stringify(store.status));
  }
  void serveStatic(url.pathname === "/" ? "/index.html" : url.pathname, response);
}).listen(config.port, "127.0.0.1", () => console.log(`[server] http://127.0.0.1:${config.port}`));

// `kill -USR2 <pid>` drops the gRPC connection to exercise the reconnect path.
process.on("SIGUSR2", () => streams.simulateDrop());

startup().catch((error: Error) => {
  store.status.error = error.message;
  const active = store.status.steps.find((step) => step.state === "active");
  if (active) store.step(active.key, { state: "error" });
  console.error(`[startup] ${error.message}`);
});
