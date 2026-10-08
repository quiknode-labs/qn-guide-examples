import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { fileURLToPath } from "node:url";

import type { HypercoreEndpoint } from "../data/endpoint.js";
import type { BookEvent, OrderStatusEvent, ReplayBlock } from "../data/types.js";

export interface L4SnapshotOrder {
  user: string;
  coin: string;
  side: "A" | "B";
  limit_px: string;
  sz: string;
  oid: string;
  timestamp: string;
  trigger_condition: string;
  is_trigger: boolean;
  trigger_px: string;
  is_position_tpsl: boolean;
  reduce_only: boolean;
  order_type: string;
  tif?: string;
  cloid?: string;
}

export interface L4Checkpoint {
  coin: string;
  time: string;
  height: string;
  bids: L4SnapshotOrder[];
  asks: L4SnapshotOrder[];
}

export interface L4CheckpointWindow {
  checkpoint: L4Checkpoint;
  blocks: ReplayBlock[];
}

export interface ObservedL2Level {
  px: string;
  sz: string;
  n: number;
}

export interface ObservedL2Snapshot {
  coin: string;
  time: string;
  blockNumber: number;
  bids: ObservedL2Level[];
  asks: ObservedL2Level[];
}

export interface ObservedL2Window {
  checkpoint: L4Checkpoint;
  snapshots: ObservedL2Snapshot[];
}

interface L4BookWireUpdate {
  snapshot?: L4Checkpoint;
  diff?: { time: string; height: string; data: string };
}

interface L4BookCall extends grpc.ClientReadableStream<L4BookWireUpdate> {}
interface L2BookWireUpdate {
  coin: string;
  time: string;
  block_number: string;
  bids: ObservedL2Level[];
  asks: ObservedL2Level[];
}
interface L2BookCall extends grpc.ClientReadableStream<L2BookWireUpdate> {}

interface OrderBookClient extends grpc.Client {
  StreamL2Book(
    request: { coin: string; n_levels: number },
    metadata: grpc.Metadata,
  ): L2BookCall;
  StreamL4Book(
    request: { coin: string },
    metadata: grpc.Metadata,
  ): L4BookCall;
}

const PROTO_PATH = fileURLToPath(
  new URL(
    import.meta.url.includes("/dist/")
      ? "../../../proto/orderbook.proto"
      : "../../proto/orderbook.proto",
    import.meta.url,
  ),
);

function createClient(endpoint: HypercoreEndpoint): OrderBookClient {
  const definition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const loaded = grpc.loadPackageDefinition(definition) as unknown as {
    hyperliquid: {
      OrderBookStreaming: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options: grpc.ChannelOptions,
      ) => OrderBookClient;
    };
  };
  return new loaded.hyperliquid.OrderBookStreaming(
    endpoint.grpcEndpoint,
    grpc.credentials.createSsl(),
    { "grpc.max_receive_message_length": 100 * 1024 * 1024 },
  );
}

export async function captureL4Checkpoint(
  endpoint: HypercoreEndpoint,
  coin: string,
  timeoutMs = 30_000,
): Promise<L4Checkpoint> {
  const client = createClient(endpoint);
  const metadata = new grpc.Metadata();
  metadata.add("x-token", endpoint.token);
  const call = client.StreamL4Book({ coin }, metadata);

  return await new Promise<L4Checkpoint>((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, checkpoint?: L4Checkpoint): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      call.cancel();
      client.close();
      if (error) reject(error);
      else resolve(checkpoint!);
    };

    const timer = setTimeout(
      () => finish(new Error(`Timed out waiting for ${coin} L4 checkpoint`)),
      timeoutMs,
    );

    call.on("data", (update) => {
      if (!update.snapshot) return;
      const snapshot = update.snapshot;
      if (snapshot.coin !== coin) {
        finish(
          new Error(`Checkpoint coin mismatch: expected ${coin}, got ${snapshot.coin}`),
        );
        return;
      }
      if (!snapshot.height || snapshot.height === "0") {
        finish(new Error("L4 checkpoint did not include a valid block height"));
        return;
      }
      finish(undefined, snapshot);
    });
    call.on("error", (error: grpc.ServiceError) => {
      if (settled && error.code === grpc.status.CANCELLED) return;
      finish(new Error(`L4 checkpoint stream failed: ${error.message}`));
    });
    call.on("end", () => {
      finish(new Error("L4 checkpoint stream ended before its snapshot"));
    });
  });
}

export async function captureL4CheckpointWindow(
  endpoint: HypercoreEndpoint,
  coin: string,
  blockCount: number,
  timeoutMs = 60_000,
): Promise<L4CheckpointWindow> {
  if (!Number.isSafeInteger(blockCount) || blockCount <= 0 || blockCount > 200) {
    throw new Error("Checkpoint validation window must contain 1-200 blocks");
  }
  const client = createClient(endpoint);
  const metadata = new grpc.Metadata();
  metadata.add("x-token", endpoint.token);
  const call = client.StreamL4Book({ coin }, metadata);

  return await new Promise<L4CheckpointWindow>((resolve, reject) => {
    let settled = false;
    let checkpoint: L4Checkpoint | undefined;
    const blocks: ReplayBlock[] = [];
    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      call.cancel();
      client.close();
      if (error) reject(error);
      else resolve({ checkpoint: checkpoint!, blocks });
    };
    const timer = setTimeout(
      () => finish(new Error(`Timed out collecting ${blockCount} ${coin} L4 blocks`)),
      timeoutMs,
    );

    call.on("data", (update) => {
      try {
        if (update.snapshot) {
          if (checkpoint) {
            throw new Error("L4 stream unexpectedly reset during validation window");
          }
          checkpoint = update.snapshot;
          return;
        }
        if (!update.diff || !checkpoint) return;
        const height = Number(update.diff.height);
        let expected = Number(checkpoint.height) + blocks.length + 1;
        if (height < expected) {
          throw new Error(`L4 stream height regressed: expected >= ${expected}, got ${height}`);
        }
        // StreamL4Book may omit heights with no selected-coin diff. JSON-RPC
        // returns those heights explicitly, but they are no-ops for this book.
        while (expected < height && blocks.length < blockCount) {
          blocks.push({
            blockNumber: expected,
            blockTime: "",
            orderEvents: [],
            bookEvents: [],
          });
          expected += 1;
        }
        if (blocks.length === blockCount) {
          finish();
          return;
        }
        const data = JSON.parse(update.diff.data) as {
          order_statuses?: OrderStatusEvent[];
          book_diffs?: BookEvent[];
        };
        if (!Array.isArray(data.order_statuses) || !Array.isArray(data.book_diffs)) {
          throw new Error("L4 diff JSON omitted order_statuses or book_diffs arrays");
        }
        blocks.push({
          blockNumber: height,
          blockTime: new Date(Number(update.diff.time)).toISOString(),
          orderEvents: data.order_statuses,
          bookEvents: data.book_diffs,
        });
        if (blocks.length === blockCount) finish();
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });
    call.on("error", (error: grpc.ServiceError) => {
      if (settled && error.code === grpc.status.CANCELLED) return;
      finish(new Error(`L4 validation stream failed: ${error.message}`));
    });
    call.on("end", () => finish(new Error("L4 validation stream ended early")));
  });
}

export async function captureObservedL2Window(
  endpoint: HypercoreEndpoint,
  coin: string,
  blockCount: number,
  levels = 100,
  timeoutMs = 60_000,
): Promise<ObservedL2Window> {
  if (!Number.isSafeInteger(blockCount) || blockCount <= 0 || blockCount > 20) {
    throw new Error("Differential validation window must contain 1-20 blocks");
  }
  if (!Number.isSafeInteger(levels) || levels <= 0 || levels > 100) {
    throw new Error("Observed L2 depth must contain 1-100 levels");
  }

  const client = createClient(endpoint);
  const metadata = new grpc.Metadata();
  metadata.add("x-token", endpoint.token);
  const call = client.StreamL2Book({ coin, n_levels: levels }, metadata);

  return await new Promise<ObservedL2Window>((resolve, reject) => {
    let settled = false;
    let checkpointStarted = false;
    let checkpoint: L4Checkpoint | undefined;
    const byHeight = new Map<number, ObservedL2Snapshot>();

    const finish = (error?: Error, snapshots?: ObservedL2Snapshot[]): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      call.cancel();
      client.close();
      if (error) reject(error);
      else resolve({ checkpoint: checkpoint!, snapshots: snapshots! });
    };
    const timer = setTimeout(
      () => finish(new Error(`Timed out collecting ${blockCount} observed ${coin} L2 snapshots`)),
      timeoutMs,
    );

    const tryFinish = (): void => {
      if (!checkpoint) return;
      const start = Number(checkpoint.height) + 1;
      const latest = Math.max(0, ...byHeight.keys());
      const snapshots: ObservedL2Snapshot[] = [];
      for (let height = start; height < start + blockCount; height += 1) {
        const snapshot = byHeight.get(height);
        if (!snapshot) {
          if (latest > height) {
            finish(new Error(`Observed L2 stream skipped height ${height}`));
          }
          return;
        }
        snapshots.push(snapshot);
      }
      finish(undefined, snapshots);
    };

    call.on("data", (update) => {
      try {
        const blockNumber = Number(update.block_number);
        if (update.coin !== coin) {
          throw new Error(`Observed L2 coin mismatch: expected ${coin}, got ${update.coin}`);
        }
        if (!Number.isSafeInteger(blockNumber) || blockNumber <= 0) {
          throw new Error(`Observed L2 returned invalid block ${update.block_number}`);
        }
        byHeight.set(blockNumber, {
          coin: update.coin,
          time: update.time,
          blockNumber,
          bids: update.bids,
          asks: update.asks,
        });
        if (!checkpointStarted) {
          checkpointStarted = true;
          void captureL4Checkpoint(endpoint, coin, timeoutMs)
            .then((captured) => {
              checkpoint = captured;
              for (const height of byHeight.keys()) {
                if (height <= Number(captured.height)) byHeight.delete(height);
              }
              tryFinish();
            })
            .catch((error: unknown) =>
              finish(error instanceof Error ? error : new Error(String(error))),
            );
        }
        tryFinish();
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });
    call.on("error", (error: grpc.ServiceError) => {
      if (settled && error.code === grpc.status.CANCELLED) return;
      finish(new Error(`Observed L2 stream failed: ${error.message}`));
    });
    call.on("end", () => finish(new Error("Observed L2 stream ended early")));
  });
}
