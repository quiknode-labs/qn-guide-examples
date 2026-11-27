// Reproduces the three review scenarios. Run with: npx tsx test/review-fixes.ts
import assert from "node:assert/strict";
import { Store } from "../server/store.ts";
import { classifyTransaction } from "../server/classify.ts";
import type { MintState } from "../server/registry.ts";

const MINT = "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const state: MintState = {
  address: MINT, symbol: "NVDAx", name: "NVIDIA xStock", decimals: 8, supplyRaw: 10n ** 14n,
  multiplier: 1, newMultiplier: 1, newMultiplierEffectiveTimestamp: 0,
} as unknown as MintState;

// Tuesday 2026-11-24, 10:00 ET: market open.
const OPEN = Date.UTC(2026, 10, 24, 15, 0, 0);

function setup(refPrice: number, lastPrice: number, t: number) {
  const store = new Store();
  store.setMints(new Map([[MINT, state]]));
  const s = store as any;
  s.events.push({ mint: MINT, t });
  const rt = s.runtime.get(MINT);
  // Baseline: 40 fresh samples with a gap scattered around 0%.
  for (let i = 0; i < 40; i++) rt.samples.push({ t: t - (40 - i) * 15_000, on: 100 + (i % 2 ? 0.1 : -0.1), ref: 100, stale: false });
  rt.lastPrice = lastPrice;
  rt.lastPriceT = t;
  store.refs.set(MINT, { price: refPrice, updatedAt: t });
  return { store, s, rt };
}
let failed = 0;
function scenario(name: string, run: () => void) {
  try { run(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${(e as Error).message}`); }
}
const quote = (t: number, price: number) => ({ t, sizes: [{ usd: 10_000, price, impactPct: 0, route: "Raydium CP" }] });

// 1. A $99 quote taken against a $100 stock. The stock moves to $98 before the check.
scenario("1", () => {
  const { store, s, rt } = setup(100, 99, OPEN);
  store.quotes.set(MINT, { ...quote(OPEN, 99), sizes: [{ usd: 10_000, price: 99, impactPct: -1, route: "Raydium CP" }] });
  store.refs.set(MINT, { price: 98, updatedAt: OPEN });
  rt.lastPrice = 97; // gap still about -1%
  for (let t = OPEN; t <= OPEN + 120_000; t += 15_000) {
    store.refs.set(MINT, { price: 98, updatedAt: t });
    rt.lastPriceT = t;
    s.evaluateOpportunities(t);
  }
  assert.equal(s.opportunities.length, 0, "a quote above the current stock price must not be listed");
  console.log("ok 1: stale quote percentage no longer produces an alert");
});

// 2. Persistent discount, stock price updated once a minute, checks every 15s.
scenario("2", () => {
  const { store, s, rt } = setup(100, 99, OPEN);
  let refT = OPEN;
  let listedAt: number | null = null;
  for (let t = OPEN; t <= OPEN + 5 * 60_000; t += 15_000) {
    if (t - refT >= 60_000) refT = t;
    store.refs.set(MINT, { price: 100, updatedAt: refT });
    store.quotes.set(MINT, quote(t, 99.5));
    rt.lastPriceT = t;
    s.evaluateOpportunities(t);
    if (listedAt === null && s.opportunities.length > 0) listedAt = t;
    if (t - refT > 30_000 && s.flagSince.has(MINT)) assert.ok(store.quoteCandidates.includes(MINT), "a held ticker stays on the quote list while paused");
  }
  assert.ok(listedAt !== null, "a discount that holds should be listed");
  const opp = s.opportunities[0];
  assert.ok(opp && Math.abs(opp.cost10k - -0.5) < 1e-9, "cost is measured against the current stock price");
  console.log(`ok 2: alert listed after ${(listedAt! - OPEN) / 1000}s and still listed at the end`);
});

// 3. Raydium CP deposit: the signer sends 0.1 NVDAx and 10 USDC, gets LP tokens.
scenario("3", () => {
  const user = "User1111111111111111111111111111111111111111";
  const pool = "Poo11111111111111111111111111111111111111111";
  const LP = "LPmint1111111111111111111111111111111111111";
  const keys = [user, "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", MINT, USDC, LP];
  const bal = (accountIndex: number, mint: string, owner: string, amount: bigint) => ({ accountIndex, mint, owner, uiTokenAmount: { amount: amount.toString() } });
  const info: any = {
    signature: new Uint8Array(64),
    transaction: { message: { header: { numRequiredSignatures: 1 }, instructions: [{ programIdIndex: 1, accounts: [], data: new Uint8Array() }], accountKeys: [] } },
    meta: {
      err: undefined, fee: 5000, preBalances: [1e9], postBalances: [1e9 - 5000],
      innerInstructions: [], loadedWritableAddresses: [], loadedReadonlyAddresses: [],
      preTokenBalances: [bal(10, MINT, user, 10_000_000n), bal(11, USDC, user, 10_000_000n), bal(12, MINT, pool, 10n ** 10n), bal(13, USDC, pool, 10n ** 9n), bal(14, LP, user, 0n)],
      postTokenBalances: [bal(10, MINT, user, 0n), bal(11, USDC, user, 0n), bal(12, MINT, pool, 10n ** 10n + 10_000_000n), bal(13, USDC, pool, 10n ** 9n + 10_000_000n), bal(14, LP, user, 5_000n)],
    },
  };
  const ctx = { mints: new Map([[MINT, state]]), solPrice: 150, refPrice: () => 100, poolOwners: new Set<string>() };
  const events = classifyTransaction(info, keys, 1, OPEN, ctx);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "lp_add", `expected lp_add, got ${events[0].type}`);
  console.log(`ok 3: deposit classified as ${events[0].type} at ${events[0].venue}`);

  // Control: a plain USDC buy must still be a trade.
  info.meta.preTokenBalances = [bal(10, MINT, user, 0n), bal(11, USDC, user, 10_000_000n), bal(12, MINT, pool, 10n ** 10n), bal(13, USDC, pool, 10n ** 9n)];
  info.meta.postTokenBalances = [bal(10, MINT, user, 10_000_000n), bal(11, USDC, user, 0n), bal(12, MINT, pool, 10n ** 10n - 10_000_000n), bal(13, USDC, pool, 10n ** 9n + 10_000_000n)];
  const buy = classifyTransaction(info, keys, 1, OPEN, ctx);
  assert.equal(buy[0].type, "buy");
  console.log(`ok 3b: a USDC buy is still a ${buy[0].type} of $${buy[0].usd}`);

  // Control: a USDC sell where the signer also pays a 0.01 SOL tip must still be a sell.
  info.meta.preBalances = [1e9]; info.meta.postBalances = [1e9 - 5000 - 1e7];
  info.meta.preTokenBalances = [bal(10, MINT, user, 10_000_000n), bal(11, USDC, user, 0n), bal(12, MINT, pool, 10n ** 10n), bal(13, USDC, pool, 10n ** 9n)];
  info.meta.postTokenBalances = [bal(10, MINT, user, 0n), bal(11, USDC, user, 10_000_000n), bal(12, MINT, pool, 10n ** 10n + 10_000_000n), bal(13, USDC, pool, 10n ** 9n - 10_000_000n)];
  const sell = classifyTransaction(info, keys, 1, OPEN, ctx);
  assert.equal(sell[0].type, "sell");
  console.log(`ok 3c: a USDC sell with a SOL tip is still a ${sell[0].type}`);
});

// 4. A 2x split between two decoded mints. Supply and the decoded total must still agree.
scenario("4", () => {
  const T = OPEN / 1000 + 600; // split takes effect 10 minutes in
  const split = { ...state, newMultiplier: 2, newMultiplierEffectiveTimestamp: T } as MintState;
  const store = new Store();
  store.setMints(new Map([[MINT, split]]));
  const s = store as any;
  const ev = (t: number, shares: number) => ({ signature: "x", slot: 1, t, mint: MINT, symbol: "NVDAx", ref: null, type: "mint", shares, usd: null, price: null, venue: null, wallet: "w", counterparty: null });
  // 1 raw-token of 10^8 before the split is 1 share; after it, 2 shares.
  store.addEvents([ev(OPEN, 1)] as any);
  store.addEvents([ev((T + 60) * 1000, 2)] as any);
  s.mints.set(MINT, { ...split, supplyRaw: split.supplyRaw + 2n * 10n ** 8n });
  const now = (T + 120) * 1000;
  const detail = s.tickerDetail("NVDAx", OPEN, now);
  assert.ok(Math.abs(detail.decodedNetShares - detail.supplyChangeShares) < 1e-9, `decoded ${detail.decodedNetShares} vs supply ${detail.supplyChangeShares}`);
  console.log(`ok 4: after a split, decoded ${detail.decodedNetShares} = supply change ${detail.supplyChangeShares}`);
});

// 5. A ticker that stopped being quoted must not show its old quote as current.
scenario("5", () => {
  const { store, s } = setup(100, 99, OPEN);
  store.quotes.set(MINT, quote(OPEN, 99.5));
  assert.ok(s.signal(MINT, OPEN + 60_000).slippage, "a 1-minute-old quote is shown");
  assert.equal(s.signal(MINT, OPEN + 4 * 60_000).slippage, null, "a 4-minute-old quote is hidden");
  console.log("ok 5: quotes over 3 minutes old are no longer shown");
});

// 6. One-sided liquidity: xStock only in, a position NFT or LP token minted out. No cash moves.
scenario("6", () => {
  const user = "User1111111111111111111111111111111111111111";
  const pool = "Poo11111111111111111111111111111111111111111";
  const NFT = "NFTmint111111111111111111111111111111111111";
  const keys = [user, "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", MINT, NFT];
  const bal = (accountIndex: number, mint: string, owner: string, amount: bigint) => ({ accountIndex, mint, owner, uiTokenAmount: { amount: amount.toString() } });
  const info: any = {
    signature: new Uint8Array(64).fill(6),
    transaction: { message: { header: { numRequiredSignatures: 1 }, instructions: [{ programIdIndex: 1, accounts: [], data: new Uint8Array() }], accountKeys: [] } },
    meta: {
      err: undefined, fee: 5000, preBalances: [1e9], postBalances: [1e9 - 5000 - 2e6], // rent under the 0.005 SOL threshold
      innerInstructions: [], loadedWritableAddresses: [], loadedReadonlyAddresses: [],
      preTokenBalances: [bal(10, MINT, user, 10_000_000n), bal(12, MINT, pool, 10n ** 10n)],
      postTokenBalances: [bal(10, MINT, user, 0n), bal(12, MINT, pool, 10n ** 10n + 10_000_000n), bal(14, NFT, user, 1n)],
    },
  };
  const ctx = { mints: new Map([[MINT, state]]), solPrice: 150, refPrice: () => 100, poolOwners: new Set<string>() };
  const events = classifyTransaction(info, keys, 1, OPEN, ctx);
  assert.equal(events[0].type, "lp_add", `expected lp_add, got ${events[0].type}`);
  // Withdrawal: position NFT burned, xStock back.
  info.meta.preTokenBalances = [bal(10, MINT, user, 0n), bal(12, MINT, pool, 10n ** 10n), bal(14, NFT, user, 1n)];
  info.meta.postTokenBalances = [bal(10, MINT, user, 10_000_000n), bal(12, MINT, pool, 10n ** 10n - 10_000_000n)];
  info.meta.postBalances = [1e9 - 5000];
  const out = classifyTransaction(info, keys, 1, OPEN, ctx);
  assert.equal(out[0].type, "lp_remove", `expected lp_remove, got ${out[0].type}`);
  console.log(`ok 6: one-sided position open is ${events[0].type}, close is ${out[0].type}`);
});

// 7. A swap paid in native SOL by a router-owned account that is not the fee payer.
//    The temporary WSOL account is opened and closed in the transaction, so only the pool's WSOL shows.
scenario("7", () => {
  const signer = "Signer11111111111111111111111111111111111111";
  const vault = "Vau1t111111111111111111111111111111111111111";
  const pool = "Poo11111111111111111111111111111111111111111";
  const keys = [signer, "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", MINT];
  const bal = (accountIndex: number, mint: string, owner: string, amount: bigint) => ({ accountIndex, mint, owner, uiTokenAmount: { amount: amount.toString() } });
  const WSOL = "So11111111111111111111111111111111111111112";
  const info: any = {
    signature: new Uint8Array(64).fill(7),
    transaction: { message: { header: { numRequiredSignatures: 1 }, instructions: [{ programIdIndex: 1, accounts: [], data: new Uint8Array() }], accountKeys: [] } },
    meta: {
      err: undefined, fee: 5000, preBalances: [1e9], postBalances: [1e9 - 5000],
      innerInstructions: [], loadedWritableAddresses: [], loadedReadonlyAddresses: [],
      preTokenBalances: [bal(10, MINT, vault, 0n), bal(12, MINT, pool, 10n ** 10n), bal(13, WSOL, pool, 10n ** 12n)],
      postTokenBalances: [bal(10, MINT, vault, 10_000_000n), bal(12, MINT, pool, 10n ** 10n - 10_000_000n), bal(13, WSOL, pool, 10n ** 12n + 666_666_667n)],
    },
  };
  const ctx = { mints: new Map([[MINT, state]]), solPrice: 150, refPrice: () => 100, poolOwners: new Set<string>() };
  const events = classifyTransaction(info, keys, 1, OPEN, ctx);
  // Which side bought is a best guess here (Guide note 9). What matters is that it stays a trade.
  assert.ok(events[0].type === "buy" || events[0].type === "sell", `expected a trade, got ${events[0].type}`);
  console.log(`ok 7: native SOL swap through a router stays a trade (${events[0].type}, $${events[0].usd?.toFixed(0)})`);
});

// Shared fixture helpers for the scenarios below.
const OTHER = "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB";
const WSOL_MINT = "So11111111111111111111111111111111111111112";
const RAYDIUM = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";
const USER = "User1111111111111111111111111111111111111111";
const POOL = "Poo11111111111111111111111111111111111111111";
const twoMints = new Map([[MINT, state], [OTHER, { ...state, address: OTHER, symbol: "TSLAx" } as MintState]]);
const tokenBal = (accountIndex: number, mint: string, owner: string, amount: bigint) => ({ accountIndex, mint, owner, uiTokenAmount: { amount: amount.toString() } });
function swapTx(keys: string[], signers: number, solBefore: number, solAfter: number, pre: unknown[], post: unknown[], fill: number): any {
  return {
    signature: new Uint8Array(64).fill(fill),
    transaction: { message: { header: { numRequiredSignatures: signers }, instructions: [{ programIdIndex: signers, accounts: [], data: new Uint8Array() }], accountKeys: [] } },
    meta: {
      err: undefined, fee: 5000, preBalances: [solBefore], postBalances: [solAfter],
      innerInstructions: [], loadedWritableAddresses: [], loadedReadonlyAddresses: [], preTokenBalances: pre, postTokenBalances: post,
    },
  };
}
const ctx2 = () => ({ mints: twoMints, solPrice: 150, refPrice: () => 100, poolOwners: new Set<string>() });

// 8. xStock-for-xStock sell where the signer also pays a 0.01 SOL tip. Must stay a sell by the user.
scenario("8", () => {
  const keys = [USER, RAYDIUM];
  const big = 1n << 40n;
  const info = swapTx(keys, 1, 1e9, 1e9 - 5000 - 1e7,
    [tokenBal(10, MINT, USER, 10_000_000n), tokenBal(11, OTHER, USER, 0n), tokenBal(12, MINT, POOL, big), tokenBal(13, OTHER, POOL, big)],
    [tokenBal(10, MINT, USER, 0n), tokenBal(11, OTHER, USER, 5_000_000n), tokenBal(12, MINT, POOL, big + 10_000_000n), tokenBal(13, OTHER, POOL, big - 5_000_000n)], 8);
  const event = classifyTransaction(info, keys, 1, OPEN, ctx2()).find((e) => e.mint === MINT)!;
  assert.equal(event.type, "sell", `expected sell, got ${event.type}`);
  assert.equal(event.wallet, USER);
  console.log("ok 8: a token-to-token sell with a SOL tip stays a sell by the user");
});

// 9. A relayer pays the fee. The user signs and sells for native SOL through a temporary WSOL account.
scenario("9", () => {
  const relayer = "Re1ayer111111111111111111111111111111111111";
  const keys = [relayer, USER, RAYDIUM];
  const big = 1n << 40n;
  const sell = swapTx(keys, 2, 1e9, 1e9 - 5000,
    [tokenBal(10, MINT, USER, 10_000_000n), tokenBal(12, MINT, POOL, big), tokenBal(13, WSOL_MINT, POOL, 10n ** 12n)],
    [tokenBal(10, MINT, USER, 0n), tokenBal(12, MINT, POOL, big + 10_000_000n), tokenBal(13, WSOL_MINT, POOL, 10n ** 12n - 66_666_667n)], 9);
  const out = classifyTransaction(sell, keys, 1, OPEN, ctx2())[0];
  assert.equal(out.type, "sell", `expected sell, got ${out.type}`);
  assert.equal(out.wallet, USER, "the signer is the trader, not the pool");
  assert.ok(Math.abs((out.usd ?? 0) - 10) < 0.01, `valued from the pool's SOL leg, got ${out.usd}`);
  // Mirror: a relayed buy with native SOL.
  const buy = swapTx(keys, 2, 1e9, 1e9 - 5000,
    [tokenBal(10, MINT, USER, 0n), tokenBal(12, MINT, POOL, big), tokenBal(13, WSOL_MINT, POOL, 10n ** 12n)],
    [tokenBal(10, MINT, USER, 10_000_000n), tokenBal(12, MINT, POOL, big - 10_000_000n), tokenBal(13, WSOL_MINT, POOL, 10n ** 12n + 66_666_667n)], 10);
  const inn = classifyTransaction(buy, keys, 1, OPEN, ctx2())[0];
  assert.equal(inn.type, "buy");
  assert.equal(inn.wallet, USER);
  console.log("ok 9: relayed native SOL sell and buy are credited to the signer");
});

// 10. A replay resends an older mint account. Supply must not move back.
scenario("10", () => {
  const store = new Store();
  store.setMints(new Map([[MINT, state]]));
  const s = store as any;
  store.onMintAccount({ ...state, supplyRaw: state.supplyRaw + 10n ** 9n }, 2000, 100, 5n);
  store.onMintAccount({ ...state }, 1000, 90, 9n); // older slot
  store.onMintAccount({ ...state }, 2000, 100, 4n); // same slot, older write
  assert.equal(s.mints.get(MINT).supplyRaw, state.supplyRaw + 10n ** 9n);
  assert.equal(s.runtime.get(MINT).supplySteps.length, 2, "no backward supply step");
  console.log("ok 10: replayed account updates are ignored");
});

// 11. More than 60 mints in the window must not push corporate action markers off the charts.
scenario("11", () => {
  const store = new Store();
  store.setMints(new Map([[MINT, state]]));
  const now = Date.now();
  (store as any).startedAt = now - 20 * 60_000; // the window starts at startup, so move startup back
  store.addEvents(Array.from({ length: 61 }, (_, i) => ({
    signature: `m${i}`, slot: 1, t: now - 1000 * i, mint: MINT, symbol: "NVDAx", ref: 100, type: "mint",
    shares: 1, usd: 100, price: null, venue: null, wallet: "w", counterparty: null,
  })) as any);
  (store as any).applied.push({ symbol: "NVDAx", mint: MINT, from: 1, to: 1.001, kind: "dividend", t: now - 5000 });
  const snap = store.snapshot({ window: "15m", chart: ["NVDAx"], page: "NVDAx" });
  assert.equal(snap.premium.markers.filter((m) => m.kind === "corp").length, 1, "main chart");
  assert.equal(snap.ticker!.markers.filter((m) => m.kind === "corp").length, 1, "ticker page");
  assert.equal(snap.premium.markers.filter((m) => m.kind === "mint").length, 60);
  console.log("ok 11: corporate action markers survive 61 mint markers");
});

// 12. A listed alert whose quote expires during the 30s pause is dropped, and one whose quote
//     turns above the stock price is dropped too.
scenario("12", () => {
  for (const [label, refresh] of [["expired", false], ["reversed", true]] as const) {
    const { store, s, rt } = setup(100, 99, OPEN);
    let listed = false;
    let t = OPEN;
    for (; t <= OPEN + 90_000; t += 15_000) {
      store.refs.set(MINT, { price: 100, updatedAt: t });
      store.quotes.set(MINT, quote(t, 99.5));
      rt.lastPriceT = t;
      s.evaluateOpportunities(t);
      listed ||= s.opportunities.length > 0;
    }
    assert.ok(listed, `${label}: listed first`);
    // Stock price stops updating at t - 15s. Aging from here on, under the 5 minute stale limit.
    const lastRef = t - 15_000;
    if (refresh) store.quotes.set(MINT, quote(t, 100.5));
    const check = refresh ? lastRef + 45_000 : lastRef + 4 * 60_000; // past FLAG_QUOTE_MS for the expired case
    rt.lastPriceT = check;
    s.evaluateOpportunities(check);
    assert.equal(s.opportunities.length, 0, `${label}: alert should be dropped`);
  }
  console.log("ok 12: alerts are dropped when their quote expires or reverses during the pause");
});

// 13. A last trade older than 15 minutes is not compared with the current stock price.
scenario("13", () => {
  const { s, rt } = setup(100, 99, OPEN);
  rt.lastPriceT = OPEN - 20 * 60_000;
  assert.equal(s.gap(MINT, OPEN).premiumPct, null);
  rt.lastPriceT = OPEN - 60_000;
  assert.ok(s.gap(MINT, OPEN).premiumPct !== null);
  console.log("ok 13: a gap needs a trade from the last 15 minutes");
});

// 14. Zap-in: the signer sells 0.6 of 1 NVDAx into pool A for $60 USDC, then deposits the other 0.4
//     with all $60 into pool B for LP tokens. Only the 0.6 sold is a trade, at $100 a share.
scenario("14", () => {
  const poolA = "PoolA111111111111111111111111111111111111111";
  const poolB = "PoolB111111111111111111111111111111111111111";
  const LP = "LPmint1111111111111111111111111111111111111";
  const keys = [USER, RAYDIUM];
  const big = 1n << 40n;
  const info = swapTx(keys, 1, 1e9, 1e9 - 5000,
    [tokenBal(1, MINT, USER, 100_000_000n), tokenBal(2, USDC, USER, 0n), tokenBal(3, MINT, poolA, big), tokenBal(4, USDC, poolA, big), tokenBal(5, MINT, poolB, big), tokenBal(6, USDC, poolB, big), tokenBal(7, LP, USER, 0n)],
    [tokenBal(1, MINT, USER, 0n), tokenBal(2, USDC, USER, 0n), tokenBal(3, MINT, poolA, big + 60_000_000n), tokenBal(4, USDC, poolA, big - 60_000_000n), tokenBal(5, MINT, poolB, big + 40_000_000n), tokenBal(6, USDC, poolB, big + 60_000_000n), tokenBal(7, LP, USER, 5n)], 14);
  const event = classifyTransaction(info, keys, 1, OPEN, ctx2())[0];
  assert.equal(event.type, "sell");
  assert.equal(event.wallet, USER);
  assert.ok(Math.abs(event.shares - 0.6) < 1e-9, `expected 0.6 shares, got ${event.shares}`);
  assert.ok(event.price !== null && Math.abs(event.price - 100) < 1e-6, `expected $100 a share, got ${event.price}`);
  console.log("ok 14: a zap-in counts only the part sold, at the right price");
});

process.exitCode = failed ? 1 : 0;
