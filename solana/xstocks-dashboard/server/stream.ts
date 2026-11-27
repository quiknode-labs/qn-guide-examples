import bs58 from "bs58";
import Client, {
  CommitmentLevel,
  CompressedAccountFilterSet,
  type SubscribeRequest,
  type SubscribeUpdate,
  type SubscribeUpdateTransactionInfo,
} from "@triton-one/yellowstone-grpc";
import { config } from "./config.ts";
import { allAccountKeys, classifyTransaction, referencesTrackedMint } from "./classify.ts";
import { parseMintAccount } from "./registry.ts";
import type { Store } from "./store.ts";

/** Reconnect delays: 1s, 2s, 4s ... capped at 30s. */
const backoffMs = (attempt: number) => Math.min(30_000, 1000 * 2 ** (attempt - 1));
/** If nothing arrives for this long the connection is treated as dead. Block metadata arrives every ~400ms. */
const SILENCE_MS = 30_000;
/** Solana gRPC can replay roughly the last 3,000 slots through `fromSlot`. */
const MAX_REPLAY_SLOTS = 2_500;
/** Average slot time, used to estimate how many slots an outage missed. */
const SLOT_MS = 400;
/** Give up on replaying after this many failed attempts, whatever the error says. */
const MAX_REPLAY_ATTEMPTS = 3;

/**
 * Build the subscribe request. Both filters come from the same cuckoo filter set:
 * `cuckoo_account_include` for transactions that reference any xStocks mint, and
 * `cuckoo_accounts_filter` for writes to the mint accounts themselves.
 */
export function buildRequest(mints: Iterable<string>, fromSlot?: number): { request: SubscribeRequest; filter: CompressedAccountFilterSet } {
  const addresses = [...mints];
  // Leave headroom above the entry count so inserts don't saturate the table.
  const filter = new CompressedAccountFilterSet(Math.max(addresses.length * 2, 100));
  for (const address of addresses) filter.insert(address);

  const request: SubscribeRequest = {
    commitment: CommitmentLevel.FINALIZED,
    accounts: {},
    slots: {},
    transactions: {},
    transactionsStatus: {},
    blocks: {},
    // Block metadata carries blockTime, which transaction updates do not.
    blocksMeta: { blockTimes: {} },
    entry: {},
    blockFooter: {},
    accountsDataSlice: [],
  };
  filter.insertIntoSubscribeRequest(request, "xstocksMints");
  request.transactions.xstocksTransactions = { ...filter.toTransactionFilter(), vote: false, failed: false };
  if (fromSlot) request.fromSlot = String(fromSlot);
  return { request, filter };
}

interface PendingSlot {
  transactions: { info: SubscribeUpdateTransactionInfo; keys: string[] }[];
  accounts: { address: string; data: Uint8Array; writeVersion: bigint }[];
}

export class StreamManager {
  private client: Client | null = null;
  private stream: Awaited<ReturnType<Client["subscribe"]>> | null = null;
  private pending = new Map<number, PendingSlot>();
  private seen = new Set<string>();
  private seenQueue: string[] = [];
  private lastSlot = 0;
  private lastUpdateAt = 0;
  /** Wall-clock time of the last update received. Unlike lastUpdateAt, a connect attempt does not reset it. */
  private lastDataAt = 0;
  private attempt = 0;
  private replayFailures = 0;
  /** True once connect() succeeded on the current attempt, so a later failure is not a network failure. */
  private connected = false;
  private stopped = false;

  constructor(private store: Store) {}

  /** Connect and keep the subscription alive forever, reconnecting with backoff. */
  async run() {
    while (!this.stopped) {
      let replaying = false;
      try {
        // Replay the slots missed while disconnected when they are still within reach. The current
        // slot is unknown until the stream answers, so estimate the outage from wall-clock time.
        const missedSlots = (Date.now() - this.lastDataAt) / SLOT_MS + 32;
        if (this.lastSlot > 0 && (missedSlots > MAX_REPLAY_SLOTS || this.replayFailures >= MAX_REPLAY_ATTEMPTS)) {
          // Too far back to replay. Resume at the tip and keep the gap.
          console.warn(`[stream] skipping replay: about ${Math.round(missedSlots)} slots missed, ${this.replayFailures} failed replays`);
          this.lastSlot = 0;
        }
        const fromSlot = this.lastSlot > 0 ? this.lastSlot - 32 : undefined;
        replaying = Boolean(fromSlot);
        this.connected = false;
        await this.connectOnce(fromSlot);
      } catch (error) {
        const reason = String((error as Error)?.message ?? error).replace(/https?:\/\/\S+/g, "<endpoint>");
        // Count only failures after the connection opened and before any data, which is where a
        // rejected fromSlot shows up. A network outage fails at connect() and must not end the replay.
        if (replaying && this.connected) this.replayFailures++;
        if (replaying && /from_?slot|replay|not available|too old/i.test(reason)) {
          // The missed slots are no longer retained. Resume at the tip and keep the gap.
          this.lastSlot = 0;
        }
        this.attempt++;
        const delay = backoffMs(this.attempt);
        console.warn(`[stream] disconnected (attempt ${this.attempt}), retrying in ${delay / 1000}s: ${reason}`);
        this.store.openGap(reason, this.attempt, Date.now() + delay);
        if (this.store.status.phase === "starting") this.store.step("stream", { state: "error", detail: `retry ${this.attempt}` });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  private async connectOnce(fromSlot?: number) {
    this.client = new Client(config.grpcEndpoint, config.grpcToken, {
      grpcDefaultCompressionAlgorithm: 1, // 0 = gzip, 1 = zstd
      grpcMaxDecodingMessageSize: 64 * 1024 * 1024,
    } as ConstructorParameters<typeof Client>[2]);
    await this.client.connect();
    this.connected = true;
    const { request } = buildRequest(this.store.mints.keys(), fromSlot);
    const stream = await this.client.subscribe(request);
    this.stream = stream;
    this.pending.clear();
    this.lastUpdateAt = Date.now();
    let first = true;

    await new Promise<void>((_resolve, reject) => {
      const watchdog = setInterval(() => {
        if (Date.now() - this.lastUpdateAt > SILENCE_MS) stream.destroy(new Error(`no updates for ${SILENCE_MS / 1000}s`));
      }, 5_000);
      const fail = (error: Error) => {
        clearInterval(watchdog);
        reject(error);
      };
      stream.on("data", (update: SubscribeUpdate) => {
        this.lastUpdateAt = Date.now();
        this.lastDataAt = this.lastUpdateAt;
        if (first && (update.blockMeta || update.transaction || update.account)) {
          first = false;
          this.attempt = 0;
          this.replayFailures = 0;
          this.connected = false;
          this.store.step("stream", { state: "done", detail: "finalized" });
          this.store.closeGap(Boolean(fromSlot));
          console.log(`[stream] live${fromSlot ? `, replaying from slot ${fromSlot}` : ""}`);
        }
        try {
          this.handle(update);
        } catch (error) {
          console.error(`[stream] failed to handle update: ${(error as Error).message}`);
        }
      });
      stream.on("error", fail);
      stream.on("end", () => fail(new Error("stream ended")));
      stream.on("close", () => fail(new Error("stream closed")));
    });
  }

  /** Replace the filters on the live stream after the registry changes. */
  resubscribe() {
    if (!this.stream) return;
    const { request } = buildRequest(this.store.mints.keys());
    this.stream.write(request);
    console.log(`[stream] filters rebuilt for ${this.store.mints.size} mints`);
  }

  /** Drop the connection on purpose. Used to exercise the reconnect path. */
  simulateDrop() {
    this.stream?.destroy(new Error("simulated drop"));
  }

  private slotBucket(slot: number): PendingSlot {
    let bucket = this.pending.get(slot);
    if (!bucket) {
      bucket = { transactions: [], accounts: [] };
      this.pending.set(slot, bucket);
    }
    return bucket;
  }

  private handle(update: SubscribeUpdate) {
    const { store } = this;
    if (update.transaction?.transaction) {
      const info = update.transaction.transaction;
      store.status.counters.transactions++;
      const keys = allAccountKeys(info);
      // Re-check the compressed filter match against the exact mint set.
      if (!referencesTrackedMint(info, keys, store.mints)) {
        store.status.counters.falsePositives++;
        return;
      }
      // Transactions arrive before their block's metadata. Hold them until blockTime is known.
      this.slotBucket(Number(update.transaction.slot)).transactions.push({ info, keys });
    } else if (update.account?.account) {
      const address = bs58.encode(update.account.account.pubkey);
      if (!store.mints.has(address)) {
        store.status.counters.falsePositives++;
        return;
      }
      store.status.counters.accountUpdates++;
      this.slotBucket(Number(update.account.slot)).accounts.push({
        address,
        data: update.account.account.data,
        writeVersion: BigInt(update.account.account.writeVersion ?? 0),
      });
    } else if (update.blockMeta) {
      const slot = Number(update.blockMeta.slot);
      const blockTime = Number(update.blockMeta.blockTime?.timestamp ?? 0) * 1000 || Date.now();
      this.lastSlot = Math.max(this.lastSlot, slot);
      store.status.slot = this.lastSlot;
      store.status.slotTime = blockTime;
      // Flush this slot and anything older that never got metadata (skipped slots have none).
      for (const [pendingSlot, bucket] of this.pending) {
        if (pendingSlot > slot) continue;
        this.pending.delete(pendingSlot);
        this.flush(pendingSlot, blockTime, bucket);
      }
    }
  }

  private flush(slot: number, blockTime: number, bucket: PendingSlot) {
    const { store } = this;
    for (const { address, data, writeVersion } of bucket.accounts) {
      const next = parseMintAccount(address, data, store.mints.get(address));
      if (next) store.onMintAccount(next, blockTime, slot, writeVersion);
    }
    for (const { info, keys } of bucket.transactions) {
      const signature = bs58.encode(info.signature);
      // A replay after a reconnect resends transactions we already hold.
      if (this.seen.has(signature)) continue;
      this.seen.add(signature);
      this.seenQueue.push(signature);
      if (this.seenQueue.length > 200_000) this.seen.delete(this.seenQueue.shift()!);
      const events = classifyTransaction(info, keys, slot, blockTime, {
        mints: store.mints,
        solPrice: store.solPrice,
        refPrice: store.refPrice,
        poolOwners: store.poolOwners,
      });
      if (events.length > 0) store.addEvents(events);
    }
  }
}
