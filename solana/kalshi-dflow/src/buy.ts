// src/buy.ts
// Buys a Yes or No outcome token using USDC as the input
import {
  createSolanaRpc,
  Signature,
} from '@solana/kit';
import type { OrderResponse } from './types';
import { loadWallet, fetchJson, signAndSend, waitForOrder, requireEnv } from './utils';

const TRADE_API = requireEnv('TRADE_API_URL');
const RPC_URL   = requireEnv('QUICKNODE_RPC_URL');
const USDC_MINT = requireEnv('USDC_MINT');

const rpc = createSolanaRpc(RPC_URL);

// Main
async function buyOutcomeToken(
  outcomeMint: string, // yesMint or noMint from market metadata
  usdcAmount: number   // USDC to spend (e.g. 1 = $1.00)
) {
  const wallet = await loadWallet();

  // USDC has 6 decimal places: $1.00 = 1_000_000 base units.
  // The DFlow /order `amount` param is the INPUT quantity (USDC to spend).
  const amountBaseUnits = usdcAmount * 1_000_000;

  console.log(`\nSpending ${usdcAmount} USDC on outcome tokens`);
  console.log(`  Input (USDC):  ${USDC_MINT}`);
  console.log(`  Output (mint): ${outcomeMint}`);
  console.log(`  Wallet:        ${wallet.address}\n`);

  // Step 1: Request an order from DFlow Trade API
  const params = new URLSearchParams({
    inputMint: USDC_MINT,
    outputMint: outcomeMint,
    amount: String(amountBaseUnits),
    userPublicKey: wallet.address,
    slippageBps: 'auto',
    dynamicComputeUnitLimit: 'true',
    prioritizationFeeLamports: '5000',
  });

  const order = await fetchJson<OrderResponse>(`${TRADE_API}/order?${params}`);
  console.log(`Order received — mode: ${order.executionMode}, expected out: ${order.outAmount} base units`);

  // Step 2: Sign and send the transaction
  const signature = await signAndSend(order, wallet.keyPair, rpc);

  console.log(`\nTransaction submitted: ${signature}`);
  console.log(`  Explorer: https://explorer.solana.com/tx/${signature}`);

  // Step 3: For async orders, poll for fill confirmation
  if (order.executionMode === 'async') {
    const result = await waitForOrder(signature, order.lastValidBlockHeight, TRADE_API);
    if (result.status === 'closed') {
      console.log(`\n✅ Order filled! Received ${result.outAmount / 1_000_000} outcome tokens`);
    } else if (result.status === 'expired') {
      console.log(`\n⚠️ Order expired before being filled. No tokens received.`);
    } else {
      console.log(`\n⚠️ Order ended with status: ${result.status}`);
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
          console.log(`\n✅ Sync order confirmed!`);
        }
        break;
      }
    }
  }
}

const [outcomeMint, amountStr] = process.argv.slice(2);
if (!outcomeMint || !amountStr) {
  console.error('Usage: npm run buy -- <outcome-mint-address> <usdc-amount>');
  process.exit(1);
}

buyOutcomeToken(outcomeMint, Number(amountStr)).catch(console.error);
