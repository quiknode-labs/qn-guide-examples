import 'dotenv/config';
import type { AppConfig, CoinBalance, PortfolioState } from './types.js';
import { fetchAllPortfolioData } from './graphql.js';
import { startCheckpointStream } from './grpc-stream.js';
import {
  createPortfolioState,
  setLoading,
  updateBalances,
  updateTransactions,
  updateStreamStatus,
  updateCheckpointInfo,
  renderStatic,
  printCheckpointLine,
  printStreamStatus,
  printRefreshStart,
  printRefreshComplete,
  printLoading,
} from './portfolio.js';

// ─── Config ───────────────────────────────────────────────────────────────────

function loadConfig(): AppConfig {
  const endpointUrl = process.env.QN_ENDPOINT_URL?.replace(/\/$/, '');
  const endpointToken = process.env.QN_ENDPOINT_TOKEN;
  const rawAddresses = process.env.SUI_ADDRESS;

  const missing: string[] = [];
  if (!endpointUrl) missing.push('QN_ENDPOINT_URL');
  if (!endpointToken) missing.push('QN_ENDPOINT_TOKEN');
  if (!rawAddresses) missing.push('SUI_ADDRESS');

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in your values.');
    process.exit(1);
  }

  // Parse comma-separated addresses, trim whitespace, lowercase
  const addresses = rawAddresses!
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter((a) => a.length > 0);

  if (addresses.length === 0) {
    console.error('SUI_ADDRESS must contain at least one valid address.');
    process.exit(1);
  }

  // Derive gRPC host: extract hostname only (strip protocol + any token path), then append :9000
  // Quicknode URLs look like: https://abc.sui-mainnet.quiknode.pro/TOKEN
  const parsedUrl = new URL(endpointUrl!);
  const grpcHost = parsedUrl.hostname + ':9000';
  const graphqlUrl = endpointUrl! + '/' + endpointToken! + '/graphql';

  return {
    endpointUrl: endpointUrl!,
    endpointToken: endpointToken!,
    addresses,
    grpcHost,
    graphqlUrl,
  };
}

// ─── Re-fetch debounce ────────────────────────────────────────────────────────

let refetchTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRefetch(config: AppConfig, state: PortfolioState): void {
  if (refetchTimer) clearTimeout(refetchTimer);
  refetchTimer = setTimeout(async () => {
    try {
      // Snapshot old balances for delta computation
      const oldBalancesByAddress = new Map<string, CoinBalance[]>();
      for (const [addr, portfolio] of state.portfolios) {
        oldBalancesByAddress.set(addr, [...portfolio.balances]);
      }

      const { balancesByAddress, transactions } = await fetchAllPortfolioData(config);
      updateBalances(state, balancesByAddress);
      updateTransactions(state, transactions);
      renderStatic(state);
      printRefreshComplete(state, oldBalancesByAddress, balancesByAddress);
    } catch (err) {
      // Non-fatal: the stream continues even if a re-fetch fails
      const msg = err instanceof Error ? err.message : String(err);
      printStreamStatus('error', `Re-fetch failed: ${msg}`);
    }
  }, 2_000);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const config = loadConfig();
  const state = createPortfolioState(config.addresses);

  // ── Phase 1: Initial load ──────────────────────────────────────────────────
  printLoading();

  try {
    const { balancesByAddress, transactions } = await fetchAllPortfolioData(config);
    updateBalances(state, balancesByAddress);
    updateTransactions(state, transactions);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    updateStreamStatus(state, 'error', `Initial load failed: ${msg}`);
  }

  setLoading(state, false);
  renderStatic(state);

  // ── Phase 2: Live gRPC stream ──────────────────────────────────────────────
  const cleanup = startCheckpointStream(
    config,

    // onCheckpoint — appends a line to the scrolling live feed
    (checkpoint, isRelevant, relevantCount, relevantChanges, matchedAddresses) => {
      updateCheckpointInfo(state, checkpoint);
      printCheckpointLine(
        checkpoint,
        isRelevant,
        relevantCount,
        relevantChanges,
        matchedAddresses,
        config.addresses
      );

      if (isRelevant) {
        printRefreshStart();
        scheduleRefetch(config, state);
      }
    },

    // onStatusChange — prints status inline in the live feed
    (status, message) => {
      updateStreamStatus(state, status, message);
      printStreamStatus(status, message);
    }
  );

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  function shutdown(): void {
    if (refetchTimer) clearTimeout(refetchTimer);
    cleanup();
    process.stdout.write('\n');
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
