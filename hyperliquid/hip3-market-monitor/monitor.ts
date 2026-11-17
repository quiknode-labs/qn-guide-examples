import * as grpc from "@grpc/grpc-js";
import * as loader from "@grpc/proto-loader";
import { fileURLToPath } from "node:url";

type Asset = { name: string; isDelisted?: boolean };
type Context = {
  markPx: string;
  oraclePx: string;
  funding: string;
  openInterest: string;
};
type Book = {
  coin: string;
  time: string;
  bids: { px: string }[];
  asks: { px: string }[];
};
type Event = { type: string; [key: string]: unknown };
export type Config = {
  endpoint: string;
  coin: string;
  pollMs?: number;
  staleMs?: number;
  spreadBps?: number;
  divergenceBps?: number;
};
type BookClient = grpc.Client & {
  StreamL2Book: (
    request: { coin: string; n_levels: number },
    metadata: grpc.Metadata
  ) => grpc.ClientReadableStream<Book>;
};

export async function startMonitor(
  config: Config,
  emit: (event: Event) => void = (event) => console.log(JSON.stringify(event))
) {
  const url = new URL(config.endpoint);
  if (url.protocol !== "https:")
    throw Error("Use a complete HTTPS Quicknode endpoint URL.");
  const base =
    url.origin +
    url.pathname.replace(/\/(evm|info|hypercore)\/?$/, "").replace(/\/$/, "");
  const token = new URL(base).pathname.split("/").filter(Boolean).at(-1);
  if (!token)
    throw Error("The endpoint URL must include its authentication token.");
  const [dex, symbol, ...extra] = config.coin.split(":");
  if (!dex || !symbol || extra.length)
    throw Error("Use a qualified HIP-3 market such as xyz:NVDA.");
  const pollMs = config.pollMs ?? 10000,
    staleMs = config.staleMs ?? 5000;
  if (pollMs < 1000 || staleMs < 1000)
    throw Error("Polling and age thresholds must be at least 1000 ms.");
  const spreadLimit = config.spreadBps ?? 20,
    divergenceLimit = config.divergenceBps ?? 50;
  if (![spreadLimit, divergenceLimit].every((v) => Number.isFinite(v) && v > 0))
    throw Error("Thresholds must be positive numbers.");
  let context: Context | undefined,
    contextAt = 0,
    book: Book | undefined,
    bookAt = 0;
  let stopped = false,
    connected = false,
    attempt = 0,
    lastStatus = "",
    lastReport = 0;
  let call: grpc.ClientReadableStream<Book> | undefined,
    retry: ReturnType<typeof setTimeout> | undefined,
    poll: ReturnType<typeof setTimeout> | undefined;
  const controllers = new Set<AbortController>();
  async function info(body: object): Promise<unknown> {
    const controller = new AbortController();
    controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(base + "/info", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) throw Error("Market context request failed.");
      return await res.json();
    } finally {
      clearTimeout(timeout);
      controllers.delete(controller);
    }
  }
  // Discover builder DEXs instead of treating the core perp universe as HIP-3 metadata.
  const dexs = (await info({ type: "perpDexs" })) as ({
    name: string;
  } | null)[];
  if (!dexs.some((d) => d?.name === dex)) throw Error("Builder DEX not found.");
  async function refresh() {
    const [meta, contexts] = (await info({
      type: "metaAndAssetCtxs",
      dex,
    })) as [{ universe: Asset[] }, Context[]];
    if (stopped) return;
    const index = meta.universe.findIndex(
      (asset) => asset.name === config.coin && !asset.isDelisted
    );
    if (index < 0 || !contexts[index]) {
      context = undefined;
      contextAt = 0;
      throw Error("Market missing or delisted.");
    }
    context = contexts[index];
    contextAt = Date.now();
  }
  await refresh();
  const definition = loader.loadSync(
    fileURLToPath(new URL("./proto/orderbook.proto", import.meta.url)),
    { keepCase: true, longs: String, defaults: true }
  );
  const proto = grpc.loadPackageDefinition(definition) as unknown as {
    hyperliquid: {
      OrderBookStreaming: new (
        host: string,
        credentials: grpc.ChannelCredentials
      ) => BookClient;
    };
  };
  const client = new proto.hyperliquid.OrderBookStreaming(
    url.hostname + ":10000",
    grpc.credentials.createSsl()
  );
  const metadata = new grpc.Metadata();
  metadata.set("x-token", token);
  const report = () => {
    if (stopped) return;
    const now = Date.now(),
      sourceTime = Number(book?.time);
    let status = "WAITING";
    const reasons: string[] = [];
    let spread: number | undefined, divergence: number | undefined;
    if (!connected) {
      status = "DISCONNECTED";
    } else if (book) {
      if (!Number.isFinite(sourceTime) || sourceTime > now + 1000) {
        status = "UNKNOWN";
        reasons.push("book timestamp invalid or receiver clock skew");
      } else if (now - sourceTime > staleMs || now - bookAt > staleMs) {
        status = "STALE";
        reasons.push("book data too old");
      } else if (!context || now - contextAt > pollMs * 2 + 5000) {
        status = "STALE";
        reasons.push("market context unavailable or too old");
      } else {
        const bid = Number(book.bids[0]?.px),
          ask = Number(book.asks[0]?.px),
          mark = Number(context.markPx),
          oracle = Number(context.oraclePx);
        if (
          ![bid, ask, mark, oracle].every((v) => Number.isFinite(v) && v > 0) ||
          ask < bid
        ) {
          status = "UNKNOWN";
          reasons.push("incomplete or invalid prices");
        } else {
          spread = ((ask - bid) / ((ask + bid) / 2)) * 10000;
          divergence = ((mark - oracle) / oracle) * 10000;
          if (spread > spreadLimit) reasons.push("wide spread");
          if (Math.abs(divergence) > divergenceLimit)
            reasons.push("mark/oracle divergence");
          status = reasons.length ? "ALERT" : "OK";
        }
      }
    }
    const fingerprint = status + reasons.join(",");
    // Emit state changes immediately, plus one periodic summary instead of every block.
    if (fingerprint !== lastStatus || now - lastReport >= 10000) {
      emit({
        type: "health",
        coin: config.coin,
        status,
        reasons,
        spreadBps: spread,
        markOracleBps: divergence,
        bookAgeMs: book ? now - sourceTime : null,
        contextReadAgeMs: context ? now - contextAt : null,
      });
      lastStatus = fingerprint;
      lastReport = now;
    }
  };
  function connect() {
    if (stopped) return;
    // Each stream delivers complete snapshots. Never reuse an old book while reconnecting.
    book = undefined;
    bookAt = 0;
    connected = true;
    report();
    const stream = client.StreamL2Book(
      { coin: config.coin, n_levels: 1 },
      metadata
    );
    call = stream;
    stream.on("data", (next: Book) => {
      if (stopped || call !== stream || next.coin !== config.coin) return;
      book = next;
      bookAt = Date.now();
      attempt = 0;
      report();
    });
    const lost = (code?: number) => {
      if (stopped || call !== stream) return;
      call = undefined;
      connected = false;
      book = undefined;
      report();
      if (
        code === grpc.status.UNAUTHENTICATED ||
        code === grpc.status.PERMISSION_DENIED
      ) {
        emit({
          type: "configuration_error",
          message:
            "Check endpoint authentication and HyperCore streaming plan access.",
        });
        stop();
        return;
      }
      const delay = Math.min(1000 * 2 ** Math.min(attempt++, 5), 30000);
      emit({ type: "reconnect", delayMs: delay });
      retry = setTimeout(connect, delay);
    };
    stream.on("error", (error: grpc.ServiceError) => lost(error.code));
    stream.on("end", () => lost());
  }
  async function pollContext() {
    try {
      await refresh();
    } catch {
      if (!stopped)
        emit({
          type: "context_error",
          message:
            "Context refresh failed; its last successful read will age out.",
        });
    }
    if (!stopped) poll = setTimeout(pollContext, pollMs);
  }
  const timer = setInterval(report, 1000);
  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    clearTimeout(retry);
    clearTimeout(poll);
    for (const c of controllers) c.abort();
    call?.cancel();
    client.close();
  }
  connect();
  poll = setTimeout(pollContext, pollMs);
  return { stop, reconnect: () => call?.cancel() };
}
