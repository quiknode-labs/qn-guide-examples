import chalk from 'chalk';
import Table from 'cli-table3';
import type {
  PortfolioState,
  AddressPortfolio,
  CoinBalance,
  TransactionRecord,
  GrpcCheckpoint,
  GrpcBalanceChange,
} from './types.js';

// ─── State factory ────────────────────────────────────────────────────────────

function makeLabel(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function createPortfolioState(addresses: string[]): PortfolioState {
  const portfolios = new Map<string, AddressPortfolio>();
  for (const addr of addresses) {
    portfolios.set(addr, { address: addr, label: makeLabel(addr), balances: [] });
  }

  return {
    addresses,
    portfolios,
    recentTransactions: [],
    lastCheckpointSeq: '—',
    lastCheckpointTime: null,
    lastUpdated: null,
    isLoading: true,
    streamStatus: 'connecting',
    errorMessage: null,
  };
}

// ─── Mutators ─────────────────────────────────────────────────────────────────

export function setLoading(state: PortfolioState, loading: boolean): void {
  state.isLoading = loading;
}

export function updateBalances(
  state: PortfolioState,
  balancesByAddress: Map<string, CoinBalance[]>
): void {
  for (const [addr, balances] of balancesByAddress) {
    const portfolio = state.portfolios.get(addr);
    if (portfolio) {
      portfolio.balances = balances;
    }
  }
  state.lastUpdated = new Date();
}

export function updateTransactions(
  state: PortfolioState,
  transactions: TransactionRecord[]
): void {
  state.recentTransactions = transactions;
}

export function updateStreamStatus(
  state: PortfolioState,
  status: PortfolioState['streamStatus'],
  errorMessage?: string
): void {
  state.streamStatus = status;
  state.errorMessage = errorMessage ?? null;
}

export function updateCheckpointInfo(
  state: PortfolioState,
  checkpoint: GrpcCheckpoint
): void {
  const seq = checkpoint.sequence_number ?? '?';
  const summaryTs = checkpoint.summary?.timestamp;
  const firstTxTs = checkpoint.transactions?.[0]?.timestamp;
  const ts = summaryTs ?? firstTxTs;
  const eventTime = ts?.seconds
    ? new Date(Number(ts.seconds) * 1000)
    : new Date();

  state.lastCheckpointSeq = seq;
  state.lastCheckpointTime = eventTime;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function truncateDigest(digest: string): string {
  if (digest.length <= 16) return digest;
  return `${digest.slice(0, 8)}...${digest.slice(-8)}`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function formatTime(date: Date): string {
  return date.toISOString().slice(11, 19);
}

function formatSeq(seq: string): string {
  const n = Number(seq);
  return isNaN(n) ? seq : n.toLocaleString('en-US');
}

/** Visual bar proportional to tx count. Yellow for relevant checkpoints. */
function txBar(count: number, isRelevant: boolean): string {
  const blocks = Math.min(Math.max(Math.ceil(count / 2), 1), 15);
  const bar = '█'.repeat(blocks);
  return isRelevant ? chalk.yellow(bar) : chalk.dim(bar);
}

/** Format a raw balance amount (smallest unit, 9 decimals) to human-readable. */
function formatChangeAmount(rawAmount: string): string {
  const isNegative = rawAmount.startsWith('-');
  const absStr = isNegative ? rawAmount.slice(1) : rawAmount;
  const DECIMALS = 9n;
  const DIVISOR = 10n ** DECIMALS;

  try {
    const raw = BigInt(absStr);
    const whole = raw / DIVISOR;
    const fraction = raw % DIVISOR;
    const fracStr =
      fraction.toString().padStart(Number(DECIMALS), '0').replace(/0+$/, '') || '0';
    return `${whole.toLocaleString('en-US')}.${fracStr}`;
  } catch {
    return absStr;
  }
}

// ─── Static section (header + balances + transactions) ────────────────────────

function renderHeader(state: PortfolioState): string {
  const border = chalk.cyan('─'.repeat(70));
  const title = chalk.cyan.bold('  SUI PORTFOLIO TRACKER');

  const lines = [border, title];

  if (state.addresses.length === 1) {
    lines.push(chalk.dim('  Address : ') + chalk.white(state.addresses[0]));
  } else {
    lines.push(chalk.dim(`  Tracking ${state.addresses.length} addresses`));
  }

  const updated =
    chalk.dim('  Updated : ') +
    (state.lastUpdated ? chalk.white(formatDate(state.lastUpdated)) : chalk.dim('—'));
  lines.push(updated, border);

  return lines.join('\n');
}

function renderBalancesForAddress(portfolio: AddressPortfolio, showLabel: boolean): string {
  const heading = showLabel
    ? chalk.bold(`\n● BALANCES`) + chalk.dim(` — ${portfolio.label}`)
    : chalk.bold('\n● COIN BALANCES');

  if (portfolio.balances.length === 0) {
    return heading + '\n  ' + chalk.dim('No coin balances found.');
  }

  const table = new Table({
    head: [chalk.bold('Coin Type'), chalk.bold('Balance')],
    colWidths: [42, 30],
    style: { head: [], border: ['grey'] },
  });

  for (const b of portfolio.balances) {
    table.push([chalk.cyan(b.coinType), chalk.white(b.displayBalance)]);
  }

  return heading + '\n' + table.toString();
}

function renderTransactions(
  txns: TransactionRecord[],
  trackedAddresses: Set<string>
): string {
  const heading = chalk.bold('\n● RECENT TRANSACTIONS');

  if (txns.length === 0) {
    return heading + '\n  ' + chalk.dim('No transactions found.');
  }

  const showSender = trackedAddresses.size > 1;

  const heads = [chalk.bold('Digest'), chalk.bold('Timestamp'), chalk.bold('Status')];
  const widths = [22, 24, 12];
  if (showSender) {
    heads.splice(1, 0, chalk.bold('From'));
    widths.splice(1, 0, 16);
  }

  const table = new Table({
    head: heads,
    colWidths: widths,
    style: { head: [], border: ['grey'] },
  });

  for (const tx of txns) {
    const statusStr =
      tx.status === 'success'
        ? chalk.green('✓ success')
        : tx.status === 'failure'
          ? chalk.red('✗ failure')
          : chalk.dim('? unknown');

    const row = [
      chalk.dim(truncateDigest(tx.digest)),
      chalk.white(tx.timestamp ? formatDate(tx.timestamp) : '—'),
      statusStr,
    ];

    if (showSender) {
      const senderLower = tx.sender.toLowerCase();
      const isTracked = trackedAddresses.has(senderLower);
      const senderDisplay = tx.sender.length > 14
        ? `${tx.sender.slice(0, 6)}...${tx.sender.slice(-4)}`
        : tx.sender;
      row.splice(1, 0, isTracked ? chalk.cyan(senderDisplay) : chalk.dim(senderDisplay));
    }

    table.push(row);
  }

  return heading + '\n' + table.toString();
}

// ─── Public API: Static render ────────────────────────────────────────────────

/**
 * Full-screen redraw of the static section. Called on startup and after
 * GraphQL refreshes. The live stream continues appending below.
 */
export function renderStatic(state: PortfolioState): void {
  const trackedSet = new Set(state.addresses);
  const showLabel = state.addresses.length > 1;

  process.stdout.write('\x1b[2J\x1b[H');
  console.log(renderHeader(state));

  // Render balances per address
  for (const addr of state.addresses) {
    const portfolio = state.portfolios.get(addr);
    if (portfolio) {
      console.log(renderBalancesForAddress(portfolio, showLabel));
    }
  }

  console.log(renderTransactions(state.recentTransactions, trackedSet));
  console.log('');
}

// ─── Public API: Live stream output ───────────────────────────────────────────

/**
 * Append a single checkpoint line to the scrolling live feed.
 * Relevant checkpoints get a yellow bar, badge, and balance change detail.
 */
export function printCheckpointLine(
  checkpoint: GrpcCheckpoint,
  isRelevant: boolean,
  relevantCount: number,
  relevantChanges: GrpcBalanceChange[],
  matchedAddresses: string[],
  allAddresses: string[]
): void {
  const seq = checkpoint.sequence_number ?? '?';
  const txCount = checkpoint.transactions?.length ?? 0;
  const summaryTs = checkpoint.summary?.timestamp;
  const firstTxTs = checkpoint.transactions?.[0]?.timestamp;
  const ts = summaryTs ?? firstTxTs;
  const eventTime = ts?.seconds
    ? new Date(Number(ts.seconds) * 1000)
    : new Date();

  const time = chalk.dim(`[${formatTime(eventTime)}]`);
  const seqStr = chalk.white(`#${formatSeq(seq)}`);
  const bar = txBar(txCount, isRelevant);
  const padded = String(txCount).padStart(3, ' ');
  const countStr = chalk.dim(`${padded} txns`);

  if (isRelevant) {
    const relevantStr = chalk.yellow.bold(` ★ ${relevantCount} relevant`);
    console.log(`  ${time} ${seqStr} ${bar} ${countStr}${relevantStr}`);

    // Show which addresses matched (only if tracking multiple)
    if (allAddresses.length > 1 && matchedAddresses.length > 0) {
      const labels = matchedAddresses.map((a) => chalk.cyan(makeLabel(a)));
      console.log(chalk.dim('             → ') + labels.join(chalk.dim(', ')));
    }

    // Print balance change breakdown
    if (relevantChanges.length > 0) {
      // Group changes by address for clarity when tracking multiple
      if (allAddresses.length > 1) {
        const byAddr = new Map<string, GrpcBalanceChange[]>();
        for (const bc of relevantChanges) {
          const addr = bc.address?.toLowerCase() ?? '';
          const list = byAddr.get(addr) ?? [];
          list.push(bc);
          byAddr.set(addr, list);
        }
        for (const [addr, changes] of byAddr) {
          const label = chalk.cyan(makeLabel(addr));
          const parts = changes.map((bc) => {
            const symbol = (bc.coin_type ?? '').split('::').pop() ?? '???';
            const amount = bc.amount ?? '0';
            const isOut = amount.startsWith('-');
            const display = formatChangeAmount(amount);
            return isOut
              ? chalk.red(`▼ ${display} ${symbol}`)
              : chalk.green(`▲ ${display} ${symbol}`);
          });
          console.log(chalk.dim('             ↳ ') + label + ' ' + parts.join('  '));
        }
      } else {
        const changes = relevantChanges.map((bc) => {
          const symbol = (bc.coin_type ?? '').split('::').pop() ?? '???';
          const amount = bc.amount ?? '0';
          const isOut = amount.startsWith('-');
          const display = formatChangeAmount(amount);
          return isOut
            ? chalk.red(`▼ ${display} ${symbol}`)
            : chalk.green(`▲ ${display} ${symbol}`);
        });
        console.log(chalk.dim('             ↳ ') + changes.join('  '));
      }
    }
  } else {
    console.log(`  ${time} ${seqStr} ${bar} ${countStr}`);
  }
}

/**
 * Print a stream status change inline in the live feed.
 */
export function printStreamStatus(
  status: PortfolioState['streamStatus'],
  message?: string
): void {
  switch (status) {
    case 'live':
      console.log(chalk.green.bold('  [● LIVE]') + chalk.dim(' stream connected'));
      break;
    case 'connecting':
      console.log(
        chalk.yellow.bold('  [◌ CONNECTING]') + chalk.dim(' establishing gRPC stream...')
      );
      break;
    case 'reconnecting':
      console.log(
        chalk.yellow.bold('  [↺ RECONNECTING]') +
          (message ? chalk.dim(` ${message}`) : '')
      );
      break;
    case 'error':
      console.log(
        chalk.red.bold('  [✗ ERROR]') + (message ? chalk.red(` ${message}`) : '')
      );
      break;
  }
}

/**
 * Print a notification that a GraphQL refresh has been triggered.
 */
export function printRefreshStart(): void {
  console.log(chalk.yellow('             ⟳ refreshing balances via GraphQL...'));
}

/**
 * Print balance deltas after a GraphQL refresh.
 */
export function printRefreshComplete(
  state: PortfolioState,
  oldBalancesByAddress: Map<string, CoinBalance[]>,
  newBalancesByAddress: Map<string, CoinBalance[]>
): void {
  const allDeltas: string[] = [];

  for (const addr of state.addresses) {
    const oldBals = oldBalancesByAddress.get(addr) ?? [];
    const newBals = newBalancesByAddress.get(addr) ?? [];
    const oldMap = new Map(oldBals.map((b) => [b.coinType, b.totalBalance]));
    const label = state.addresses.length > 1 ? makeLabel(addr) : '';

    for (const nb of newBals) {
      const oldRaw = oldMap.get(nb.coinType);
      if (!oldRaw || oldRaw === nb.totalBalance) continue;

      try {
        const diff = BigInt(nb.totalBalance) - BigInt(oldRaw);
        if (diff === 0n) continue;

        const symbol = nb.coinType.split('::').pop() ?? nb.coinType;
        const isUp = diff > 0n;
        const display = formatChangeAmount((isUp ? diff : -diff).toString());
        const arrow = isUp ? chalk.green(`▲ ${display}`) : chalk.red(`▼ ${display}`);
        const prefix = label ? `${chalk.cyan(label)} ` : '';
        allDeltas.push(`${prefix}${symbol}: ${arrow}`);
      } catch {
        // skip if BigInt fails
      }
    }
  }

  if (allDeltas.length > 0) {
    console.log(
      chalk.green('  ✓ balances refreshed') +
        chalk.dim(' — ') +
        allDeltas.join(chalk.dim('  '))
    );
  } else {
    console.log(chalk.green('  ✓ balances refreshed') + chalk.dim(' — no changes'));
  }
}

/**
 * Print a loading indicator (used during initial GraphQL fetch).
 */
export function printLoading(): void {
  console.log(chalk.yellow('\n  ⟳ Loading portfolio data...\n'));
}
