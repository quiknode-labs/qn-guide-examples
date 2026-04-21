import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import path from 'path';
import type {
  AppConfig,
  GrpcBalanceChange,
  GrpcCheckpoint,
  SubscribeCheckpointsResponse,
} from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckpointHandler = (
  checkpoint: GrpcCheckpoint,
  isRelevant: boolean,
  relevantCount: number,
  relevantChanges: GrpcBalanceChange[],
  /** Which tracked addresses were matched in this checkpoint */
  matchedAddresses: string[]
) => void;

export type StreamStatusHandler = (
  status: 'connecting' | 'live' | 'reconnecting' | 'error',
  message?: string
) => void;

// ─── Proto loading ────────────────────────────────────────────────────────────

function loadSubscriptionClient(config: AppConfig): grpc.Client {
  const PROTO_PATH = path.join(
    __dirname,
    '../protos/proto/sui/rpc/v2/subscription_service.proto'
  );
  const INCLUDE_DIR = path.join(__dirname, '../protos/proto');

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [INCLUDE_DIR],
  });

  const suiProto = grpc.loadPackageDefinition(packageDefinition) as Record<string, unknown>;

  // Navigate: sui.rpc.v2.SubscriptionService
  const SubscriptionService = (
    ((suiProto['sui'] as Record<string, unknown>)['rpc'] as Record<string, unknown>)['v2'] as Record<string, unknown>
  )['SubscriptionService'] as typeof grpc.Client;

  return new SubscriptionService(config.grpcHost, grpc.credentials.createSsl());
}

function buildMetadata(token: string): grpc.Metadata {
  const metadata = new grpc.Metadata();
  metadata.add('x-token', token);
  return metadata;
}

// ─── Address filtering ────────────────────────────────────────────────────────

function filterCheckpoint(
  checkpoint: GrpcCheckpoint,
  trackedAddresses: Set<string>
): {
  relevant: boolean;
  relevantCount: number;
  relevantChanges: GrpcBalanceChange[];
  matchedAddresses: string[];
} {
  let relevantCount = 0;
  const relevantChanges: GrpcBalanceChange[] = [];
  const matchedSet = new Set<string>();

  for (const tx of checkpoint.transactions ?? []) {
    let matched = false;

    // Check transaction sender
    const sender = tx.transaction?.sender?.toLowerCase();
    if (sender && trackedAddresses.has(sender)) {
      matched = true;
      matchedSet.add(sender);
    }

    // Check balance changes (catches received transfers, DEX interactions, etc.)
    if (!matched) {
      for (const bc of tx.balance_changes ?? []) {
        const bcAddr = bc.address?.toLowerCase();
        if (bcAddr && trackedAddresses.has(bcAddr)) {
          matched = true;
          matchedSet.add(bcAddr);
          break;
        }
      }
    }

    if (matched) {
      relevantCount++;
      // Collect balance changes for any tracked address from this transaction
      for (const bc of tx.balance_changes ?? []) {
        const bcAddr = bc.address?.toLowerCase();
        if (bcAddr && trackedAddresses.has(bcAddr)) {
          relevantChanges.push(bc);
          matchedSet.add(bcAddr);
        }
      }
    }
  }

  return {
    relevant: relevantCount > 0,
    relevantCount,
    relevantChanges,
    matchedAddresses: [...matchedSet],
  };
}

// ─── Reconnect backoff ────────────────────────────────────────────────────────

function reconnectDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30_000);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startCheckpointStream(
  config: AppConfig,
  onCheckpoint: CheckpointHandler,
  onStatusChange: StreamStatusHandler
): () => void {
  let cancelled = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let currentStream: grpc.ClientReadableStream<unknown> | null = null;
  let attempt = 0;

  // Build a Set for O(1) address lookup
  const trackedAddresses = new Set(config.addresses);

  // Create the gRPC client once and reuse across reconnects
  let client: grpc.Client;
  try {
    client = loadSubscriptionClient(config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onStatusChange('error', `Failed to load gRPC client: ${msg}`);
    return () => {};
  }

  function connect(): void {
    if (cancelled) return;

    onStatusChange(attempt === 0 ? 'connecting' : 'reconnecting');
    const metadata = buildMetadata(config.endpointToken);

    // Specify a read_mask so the server populates the checkpoint fields we need.
    // Paths are relative to the Checkpoint message (not the response wrapper).
    const request = {
      read_mask: {
        paths: [
          'sequence_number',
          'summary.timestamp',
          'transactions.digest',
          'transactions.transaction.sender',
          'transactions.effects.status',
          'transactions.balance_changes',
          'transactions.timestamp',
        ],
      },
    };

    const stream = (client as unknown as Record<string, Function>)[
      'SubscribeCheckpoints'
    ](request, metadata) as grpc.ClientReadableStream<unknown>;

    currentStream = stream;
    let receivedFirst = false;

    stream.on('data', (raw: unknown) => {
      if (cancelled) return;

      if (!receivedFirst) {
        receivedFirst = true;
        attempt = 0;
        onStatusChange('live');
      }

      const response = raw as SubscribeCheckpointsResponse;
      const checkpoint = response.checkpoint;
      if (!checkpoint) return;

      // The cursor IS the checkpoint sequence number (per proto comment).
      // The checkpoint object itself may not have sequence_number populated.
      if (!checkpoint.sequence_number && response.cursor) {
        checkpoint.sequence_number = response.cursor;
      }

      const { relevant, relevantCount, relevantChanges, matchedAddresses } =
        filterCheckpoint(checkpoint, trackedAddresses);
      onCheckpoint(checkpoint, relevant, relevantCount, relevantChanges, matchedAddresses);
    });

    stream.on('error', (err: Error) => {
      if (cancelled) return;
      scheduleReconnect(err.message);
    });

    stream.on('end', () => {
      if (cancelled) return;
      scheduleReconnect('Stream ended unexpectedly');
    });
  }

  function scheduleReconnect(reason: string): void {
    if (cancelled) return;
    onStatusChange('reconnecting', reason);
    attempt++;
    const delay = reconnectDelay(attempt);
    reconnectTimer = setTimeout(() => {
      if (!cancelled) connect();
    }, delay);
  }

  connect();

  return () => {
    cancelled = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (currentStream) currentStream.destroy();
    client.close();
  };
}
