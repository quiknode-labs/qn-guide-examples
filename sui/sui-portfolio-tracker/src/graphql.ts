import type { AppConfig, CoinBalance, TransactionRecord } from './types.js';

// ─── Internal response types ─────────────────────────────────────────────────

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface BalancesData {
  address: {
    balances: {
      nodes: Array<{
        coinType: { repr: string };
        totalBalance: string;
      }>;
    };
  } | null;
}

interface TransactionsData {
  address: {
    transactions: {
      nodes: Array<{
        digest: string;
        sender: { address: string } | null;
        effects: { status: string; timestamp: string | null } | null;
      }>;
    };
  } | null;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const BALANCES_QUERY = `
  query GetBalances($address: SuiAddress!) {
    address(address: $address) {
      balances {
        nodes {
          coinType { repr }
          totalBalance
        }
      }
    }
  }
`;

const TRANSACTIONS_QUERY = `
  query GetTransactions($address: SuiAddress!) {
    address(address: $address) {
      transactions(last: 20) {
        nodes {
          digest
          sender { address }
          effects { status timestamp }
        }
      }
    }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function executeGraphQL<T>(
  config: AppConfig,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(config.graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP error ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors && json.errors.length > 0) {
    throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`);
  }

  if (!json.data) {
    throw new Error('GraphQL returned no data');
  }

  return json.data;
}

/**
 * Format a raw balance string (MIST for SUI, smallest unit for others) into a
 * human-readable string. Uses BigInt to avoid float precision issues.
 */
function formatBalance(rawBalance: string, coinType: string): string {
  const symbol = coinType.split('::').pop() ?? coinType;

  // Most Sui coins use 9 decimal places (MIST). We apply this universally
  // since we don't have per-coin metadata here.
  const DECIMALS = 9n;
  const DIVISOR = 10n ** DECIMALS;

  try {
    const raw = BigInt(rawBalance);
    const whole = raw / DIVISOR;
    const fraction = raw % DIVISOR;
    const fractionStr = fraction.toString().padStart(Number(DECIMALS), '0');
    const wholeFormatted = whole.toLocaleString('en-US');
    return `${wholeFormatted}.${fractionStr} ${symbol}`;
  } catch {
    return `${rawBalance} ${symbol}`;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchCoinBalances(
  config: AppConfig,
  address: string
): Promise<CoinBalance[]> {
  const data = await executeGraphQL<BalancesData>(config, BALANCES_QUERY, {
    address,
  });

  const nodes = data.address?.balances?.nodes ?? [];

  return nodes.map((node) => ({
    coinType: node.coinType.repr,
    totalBalance: node.totalBalance,
    displayBalance: formatBalance(node.totalBalance, node.coinType.repr),
  }));
}

export async function fetchRecentTransactions(
  config: AppConfig,
  address: string
): Promise<TransactionRecord[]> {
  const data = await executeGraphQL<TransactionsData>(config, TRANSACTIONS_QUERY, {
    address,
  });

  const nodes = data.address?.transactions?.nodes ?? [];

  return nodes.map((node) => {
    const rawStatus = node.effects?.status?.toUpperCase() ?? '';
    const status: TransactionRecord['status'] =
      rawStatus === 'SUCCESS' ? 'success' : rawStatus === 'FAILURE' ? 'failure' : 'unknown';

    return {
      digest: node.digest,
      timestamp: node.effects?.timestamp ?? null,
      sender: node.sender?.address ?? '',
      status,
    };
  });
}

/**
 * Fetch balances for all tracked addresses and merged transactions.
 * Returns a map of address → balances, plus a merged + deduplicated transaction list.
 */
export async function fetchAllPortfolioData(
  config: AppConfig
): Promise<{
  balancesByAddress: Map<string, CoinBalance[]>;
  transactions: TransactionRecord[];
}> {
  // Fetch balances + transactions for every address in parallel
  const results = await Promise.all(
    config.addresses.map(async (addr) => {
      const [balances, transactions] = await Promise.all([
        fetchCoinBalances(config, addr),
        fetchRecentTransactions(config, addr),
      ]);
      return { addr, balances, transactions };
    })
  );

  const balancesByAddress = new Map<string, CoinBalance[]>();
  const allTxns: TransactionRecord[] = [];
  const seenDigests = new Set<string>();

  for (const { addr, balances, transactions } of results) {
    balancesByAddress.set(addr, balances);
    for (const tx of transactions) {
      if (!seenDigests.has(tx.digest)) {
        seenDigests.add(tx.digest);
        allTxns.push(tx);
      }
    }
  }

  // Sort merged transactions by timestamp descending, keep last 20
  allTxns.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  return {
    balancesByAddress,
    transactions: allTxns.slice(0, 20),
  };
}
