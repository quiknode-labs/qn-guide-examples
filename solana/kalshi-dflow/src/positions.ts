// src/positions.ts
// Lists all open prediction market positions for a wallet
import { createSolanaRpc } from '@solana/kit';
import type { Market } from './types';
import { loadWallet, fetchJson, parseMintAndBalance, getWalletTokenAccounts, requireEnv } from './utils';

const METADATA_API = requireEnv('METADATA_API_URL');
const RPC_URL      = requireEnv('QUICKNODE_RPC_URL');

const rpc = createSolanaRpc(RPC_URL);

// Main
async function getPositions(walletAddress: string) {
  const tokenAccounts = await getWalletTokenAccounts(rpc, walletAddress);
  const heldMints: string[] = [];
  const mintToBalance: Record<string, bigint> = {};

  for (const { account } of tokenAccounts) {
    const { mint, amount } = parseMintAndBalance(account.data as [string, string]);
    if (amount > 0n) {
      heldMints.push(mint);
      mintToBalance[mint] = amount;
    }
  }

  if (heldMints.length === 0) {
    console.log('No SPL tokens found in wallet.');
    return;
  }

  console.log(`\nChecking ${heldMints.length} token(s) for prediction market positions...\n`);

  const positions: { mint: string; side: 'YES' | 'NO'; market: Market; balance: bigint }[] = [];

  // For each held mint, check if it is an outcome token via DFlow Metadata API
  for (const mint of heldMints) {
    let market: Market;
    try {
      market = await fetchJson<Market>(`${METADATA_API}/api/v1/market/by-mint/${mint}`);
    } catch { continue; }
    const allAccts = Object.values(market.accounts);
    const side = allAccts.some(a => a.yesMint === String(mint)) ? 'YES' : 'NO';
    positions.push({ mint, side, market, balance: mintToBalance[mint]! });
  }

  if (positions.length === 0) {
    console.log('No prediction market positions found.');
    return;
  }

  console.log(`Found ${positions.length} open position(s):\n`);

  for (const pos of positions) {
    const acct = Object.values(pos.market.accounts)[0];
    console.log(`Market:     ${pos.market.ticker}`);
    console.log(`Title:      ${pos.market.title}`);
    console.log(`Side:       ${pos.side}`);
    console.log(`Mint:       ${pos.mint}`);
    console.log(`Balance:    ${(Number(pos.balance) / 1_000_000).toFixed(6)} tokens`);
    console.log(`Status:     ${pos.market.status}${pos.market.result ? ` (result: ${pos.market.result})` : ''}`);
    const isOpen = acct?.redemptionStatus === 'open';
    const sideWon =
      (pos.side === 'YES' && pos.market.result === 'yes') ||
      (pos.side === 'NO'  && pos.market.result === 'no');
    const isScalar = !pos.market.result && acct?.scalarOutcomePercent != null;
    const redeemable = isOpen && (sideWon || isScalar);
    const redeemLabel = redeemable
      ? '✅ Yes'
      : !pos.market.result
        ? '⏳ Pending (not yet determined)'
        : sideWon
          ? '⏳ Won — redemption not open yet'
          : '❌ Lost';
    console.log(`Redeemable: ${redeemLabel}`);
    console.log();
  }
}

loadWallet()
  .then(({ address: walletAddress }) => getPositions(walletAddress))
  .catch(console.error);
