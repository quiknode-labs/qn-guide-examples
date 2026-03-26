import { createSolanaRpc, Signature } from '@solana/kit';
import type { Market, OrderResponse } from './types';
import { loadWallet, fetchJson, signAndSend, waitForOrder, parseMintAndBalance, getWalletTokenAccounts, requireEnv } from './utils';

const METADATA_API = requireEnv('METADATA_API_URL');
const TRADE_API    = requireEnv('TRADE_API_URL');
const RPC_URL      = requireEnv('QUICKNODE_RPC_URL');
const USDC_MINT    = requireEnv('USDC_MINT');

const rpc = createSolanaRpc(RPC_URL);

// Main
async function redeemOutcomeTokens(outcomeMint: string) {
  const wallet = await loadWallet();

  const tokenAccounts = await getWalletTokenAccounts(rpc, wallet.address);
  let rawBalance = 0n;
  for (const { account } of tokenAccounts) {
    const { mint, amount } = parseMintAndBalance(account.data as [string, string]);
    if (mint === outcomeMint) { rawBalance = amount; break; }
  }
  if (rawBalance === 0n) {
    console.error('No balance found for this mint in your wallet.');
    process.exit(1);
  }
  const tokenAmount = Number(rawBalance);
  const displayAmount = tokenAmount / 1_000_000;

  // Step 1: Verify the token is redeemable
  const market = await fetchJson<Market>(`${METADATA_API}/api/v1/market/by-mint/${outcomeMint}`);
  const allAccts = Object.values(market.accounts);
  const acct = allAccts.find(a => a.yesMint === outcomeMint || a.noMint === outcomeMint)
            ?? allAccts[0];
  if (!acct) throw new Error('No account info found for this market.');

  const isWinningMint =
    (market.result === 'yes' && allAccts.some(a => a.yesMint === outcomeMint)) ||
    (market.result === 'no'  && allAccts.some(a => a.noMint  === outcomeMint));
  const isScalar = !market.result && acct.scalarOutcomePercent !== null;

  if (!isWinningMint && !isScalar) {
    console.log(`\n⚠️ This outcome token cannot be redeemed.`);
    console.log(`  Market result: ${market.result ?? 'not yet determined'}`);
    console.log(`  Market status: ${market.status}`);
    return;
  }

  if (acct.redemptionStatus !== 'open') {
    console.log(`\n⚠️ Redemption window is not open yet.`);
    console.log(`  redemptionStatus: ${acct.redemptionStatus}`);
    return;
  }

  console.log(`\nRedeeming ${displayAmount} tokens from market: ${market.ticker}`);

  if (isScalar && acct.scalarOutcomePercent !== null) {
    const yesPct = (acct.scalarOutcomePercent / 100).toFixed(2);
    const noPct = ((10_000 - acct.scalarOutcomePercent) / 100).toFixed(2);
    console.log(`  Scalar market — YES payout: ${yesPct}%  NO payout: ${noPct}%`);
  }

  // Step 2: Request a redemption order (same /order endpoint as buying)
  const params = new URLSearchParams({
    inputMint: outcomeMint,
    outputMint: USDC_MINT,
    amount: String(tokenAmount),
    userPublicKey: wallet.address,
  });

  const order = await fetchJson<OrderResponse>(`${TRADE_API}/order?${params}`);

  // Step 3: Sign and send
  const signature = await signAndSend(order, wallet.keyPair, rpc);

  console.log(`\nTransaction submitted: ${signature}`);
  console.log(`  Explorer: https://explorer.solana.com/tx/${signature}`);

  // Step 4: Monitor until settled
  if (order.executionMode === 'async') {
    const result = await waitForOrder(signature, order.lastValidBlockHeight, TRADE_API);
    if (result.status === 'closed') {
      console.log(`\n✅ Redemption complete! Received ${result.outAmount / 1_000_000} USDC`);
    } else {
      console.log(`\n⚠️ Redemption ended with status: ${result.status}`);
    }
  } else {
    // Sync: poll signature statuses until confirmed
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1_000));
      const { value: statuses } = await rpc.getSignatureStatuses([signature as Signature]).send();
      const s = statuses[0];
      if (s?.confirmationStatus === 'confirmed' || s?.confirmationStatus === 'finalized') {
        if (s.err) {
          console.error(`\n❌ Transaction failed on-chain:`, s.err);
        } else {
          console.log(`\n✅ Redemption confirmed!`);
        }
        break;
      }
    }
  }
}

const [mint] = process.argv.slice(2);
if (!mint) {
  console.error('Usage: npm run redeem -- <outcome-mint-address>');
  process.exit(1);
}

redeemOutcomeTokens(mint).catch(console.error);
