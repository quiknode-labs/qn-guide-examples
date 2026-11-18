import type { HypercoreEndpoint } from "./endpoint.js";
import type {
  BookEvent,
  HypercoreBlock,
  OrderStatusEvent,
  ReplayBlock,
} from "./types.js";

interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

interface BatchBlocksResult<T> {
  blocks: Array<HypercoreBlock<T>>;
}

export interface FetchReport {
  requests: number;
  blocks: number;
  estimatedJsonRpcCredits: number;
  elapsedMs: number;
}

export async function fetchLatestBlockNumber(
  endpoint: HypercoreEndpoint,
  stream: "book" | "orders",
): Promise<number> {
  const height = await rpc<number>(endpoint, "hl_getLatestBlockNumber", [stream]);
  if (!Number.isSafeInteger(height) || height < 0) {
    throw new Error(`${stream} returned invalid latest block number ${String(height)}`);
  }
  return height;
}

const MAX_BLOCKS_PER_REQUEST = 200;

async function rpc<T>(
  endpoint: HypercoreEndpoint,
  method: string,
  params: unknown,
): Promise<T> {
  const response = await fetch(endpoint.hypercoreUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`HyperCore HTTP ${response.status}: ${response.statusText}`);
  }
  const payload = (await response.json()) as JsonRpcResponse<T>;
  if (payload.error) {
    throw new Error(
      `HyperCore ${method} failed (${payload.error.code}): ${payload.error.message}`,
    );
  }
  if (payload.result === undefined) {
    throw new Error(`HyperCore ${method} returned no result`);
  }
  return payload.result;
}

async function fetchStreamRange<T>(
  endpoint: HypercoreEndpoint,
  stream: "book" | "orders",
  from: number,
  to: number,
): Promise<Array<HypercoreBlock<T>>> {
  const result = await rpc<BatchBlocksResult<T>>(
    endpoint,
    "hl_getBatchBlocks",
    { stream, from, to },
  );
  const expected = to - from + 1;
  if (result.blocks.length !== expected) {
    throw new Error(
      `${stream} returned ${result.blocks.length} blocks for inclusive range ${from}-${to}; expected ${expected}`,
    );
  }
  result.blocks.forEach((block, index) => {
    const expectedHeight = from + index;
    if (block.block_number !== expectedHeight) {
      throw new Error(
        `${stream} block gap/order error: expected ${expectedHeight}, got ${block.block_number}`,
      );
    }
  });
  return result.blocks;
}

export async function fetchReplayBlocks(
  endpoint: HypercoreEndpoint,
  from: number,
  to: number,
): Promise<{ blocks: ReplayBlock[]; report: FetchReport }> {
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 || to < from) {
    throw new Error(`Invalid inclusive block range ${from}-${to}`);
  }
  const started = performance.now();
  const blocks: ReplayBlock[] = [];
  let requests = 0;

  for (let pageFrom = from; pageFrom <= to; pageFrom += MAX_BLOCKS_PER_REQUEST) {
    const pageTo = Math.min(to, pageFrom + MAX_BLOCKS_PER_REQUEST - 1);
    const [bookBlocks, orderBlocks] = await Promise.all([
      fetchStreamRange<BookEvent>(endpoint, "book", pageFrom, pageTo),
      fetchStreamRange<OrderStatusEvent>(endpoint, "orders", pageFrom, pageTo),
    ]);
    requests += 2;

    for (let index = 0; index < bookBlocks.length; index += 1) {
      const book = bookBlocks[index]!;
      const orders = orderBlocks[index]!;
      if (
        book.block_number !== orders.block_number ||
        book.block_time !== orders.block_time
      ) {
        throw new Error(
          `book/orders alignment mismatch at page index ${index}: ${book.block_number}/${orders.block_number}`,
        );
      }
      blocks.push({
        blockNumber: book.block_number,
        blockTime: book.block_time,
        bookEvents: book.events,
        orderEvents: orders.events,
      });
    }
  }

  const streamBlocks = (to - from + 1) * 2;
  return {
    blocks,
    report: {
      requests,
      blocks: streamBlocks,
      estimatedJsonRpcCredits: streamBlocks * 5,
      elapsedMs: Math.round(performance.now() - started),
    },
  };
}
