import bs58 from "bs58";
import type { SubscribeUpdateTransactionInfo } from "@triton-one/yellowstone-grpc";
import { STABLE_DECIMALS, TOKEN_2022, USD_STABLES, WSOL } from "./config.ts";
import { type MintState, rawToShares } from "./registry.ts";
import type { DecodedEvent, EventType } from "../shared/types.ts";
import { aggregatorLabel, dexLabel, isInfrastructure, lendingLabel, shortAddress } from "./venues.ts";

export interface ClassifyContext {
  mints: Map<string, MintState>;
  solPrice: number | null;
  refPrice: (mint: string) => number | null;
  /** Owners seen on the pool side of a trade. Used when the trader did not sign. */
  poolOwners: Set<string>;
}

export type Classified = Omit<DecodedEvent, "id">;

const TRANSFER_CHECKED = 12;
const LAMPORTS_PER_SOL = 1e9;

/** Every account the transaction can touch: static keys plus address lookup table loads. */
export function allAccountKeys(info: SubscribeUpdateTransactionInfo): string[] {
  return [
    ...(info.transaction?.message?.accountKeys ?? []),
    ...(info.meta?.loadedWritableAddresses ?? []),
    ...(info.meta?.loadedReadonlyAddresses ?? []),
  ].map((key) => bs58.encode(key));
}

/**
 * The compressed filter matches about 1% of transactions by accident.
 * Confirm the match against the exact mint set before decoding.
 */
export function referencesTrackedMint(info: SubscribeUpdateTransactionInfo, keys: string[], mints: Map<string, MintState>): boolean {
  if (keys.some((key) => mints.has(key))) return true;
  const balances = [...(info.meta?.preTokenBalances ?? []), ...(info.meta?.postTokenBalances ?? [])];
  return balances.some((balance) => mints.has(balance.mint));
}

interface TransferCall {
  mint: string;
  caller: string;
  amount: bigint;
  sourceOwner: string | undefined;
  destinationOwner: string | undefined;
}

/**
 * List every inner transferChecked on an xStocks mint with the program that called it.
 * Inner instructions carry a stack height, so the caller is the instruction one level up.
 */
function transferCalls(info: SubscribeUpdateTransactionInfo, keys: string[], mints: Map<string, MintState>): TransferCall[] {
  const calls: TransferCall[] = [];
  const message = info.transaction?.message;
  const meta = info.meta;
  if (!message || !meta) return calls;
  const ownerOfAccount = new Map<number, string>();
  for (const balance of [...meta.preTokenBalances, ...meta.postTokenBalances]) ownerOfAccount.set(balance.accountIndex, balance.owner);
  for (const group of meta.innerInstructions) {
    const top = message.instructions[group.index];
    if (!top) continue;
    const stack = [keys[top.programIdIndex]];
    for (const ix of group.instructions) {
      const program = keys[ix.programIdIndex];
      const height = ix.stackHeight ?? 2;
      stack.length = Math.max(1, height - 1);
      const caller = stack[stack.length - 1];
      stack.push(program);
      // transferChecked: data [12, amount u64 LE, decimals], accounts [source, mint, destination, authority]
      if (program !== TOKEN_2022 || ix.data[0] !== TRANSFER_CHECKED || ix.data.length < 9) continue;
      const mint = keys[ix.accounts[1]];
      if (!mints.has(mint)) continue;
      calls.push({
        mint,
        caller,
        amount: Buffer.from(ix.data.buffer, ix.data.byteOffset + 1, 8).readBigUInt64LE(0),
        sourceOwner: ownerOfAccount.get(ix.accounts[0]),
        destinationOwner: ownerOfAccount.get(ix.accounts[2]),
      });
    }
  }
  return calls;
}

/**
 * Name the venue for one mint. `poolSide` holds the owners on the other side of the trade.
 * Only transfers into or out of those owners count, because routers and fee programs also
 * forward the same tokens through temporary accounts.
 */
function pickVenue(calls: TransferCall[], mint: string, poolSide: Set<string>, programs: Set<string>): string | null {
  const moved = new Map<string, bigint>();
  for (const call of calls) {
    if (call.mint !== mint) continue;
    const touchesPool = (call.sourceOwner && poolSide.has(call.sourceOwner)) || (call.destinationOwner && poolSide.has(call.destinationOwner));
    if (!touchesPool) continue;
    moved.set(call.caller, (moved.get(call.caller) ?? 0n) + call.amount);
  }
  const ranked = [...moved.entries()].sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0)).map(([program]) => program);
  // 1. A labelled pool program moved the tokens.
  for (const program of ranked) {
    const label = dexLabel(program);
    if (label) return label;
  }
  // 2. An unlabelled program moved them. Show its address. Guessing from other programs in the
  //    transaction would credit the wrong pool on multi-hop routes.
  const unlabelled = ranked.find((program) => !aggregatorLabel(program) && !isInfrastructure(program));
  if (unlabelled) return shortAddress(unlabelled);
  // 3. A router moved the tokens itself, or there was no inner transfer. Use any labelled pool, then the router.
  for (const program of programs) {
    const label = dexLabel(program);
    if (label) return label;
  }
  for (const program of programs) {
    const label = aggregatorLabel(program);
    if (label) return `${label} (pool unknown)`;
  }
  return null;
}

/** Decode one confirmed-match transaction into zero or more events, one per xStocks mint it moved. */
export function classifyTransaction(
  info: SubscribeUpdateTransactionInfo,
  keys: string[],
  slot: number,
  blockTime: number,
  ctx: ClassifyContext,
): Classified[] {
  const meta = info.meta;
  const message = info.transaction?.message;
  if (!meta || !message || meta.err) return [];

  const signature = bs58.encode(info.signature);
  const signers = new Set(keys.slice(0, message.header?.numRequiredSignatures ?? 1));
  const feePayer = keys[0];

  // Net change per owner and mint. An account missing from one side counts as zero there.
  const deltas = new Map<string, Map<string, bigint>>();
  const held = new Map<string, bigint>(); // `${owner}|${mint}` -> pre + post, a rough size of the holder
  const apply = (balance: (typeof meta.preTokenBalances)[number], sign: bigint) => {
    const amount = BigInt(balance.uiTokenAmount?.amount ?? "0");
    const perMint = deltas.get(balance.owner) ?? new Map<string, bigint>();
    perMint.set(balance.mint, (perMint.get(balance.mint) ?? 0n) + sign * amount);
    deltas.set(balance.owner, perMint);
    const key = `${balance.owner}|${balance.mint}`;
    held.set(key, (held.get(key) ?? 0n) + amount);
  };
  for (const balance of meta.preTokenBalances) apply(balance, -1n);
  for (const balance of meta.postTokenBalances) apply(balance, 1n);

  const moved = new Set<string>();
  for (const perMint of deltas.values()) {
    for (const [mint, delta] of perMint) if (delta !== 0n && ctx.mints.has(mint)) moved.add(mint);
  }
  if (moved.size === 0) return [];

  const programs = new Set<string>();
  for (const ix of message.instructions) programs.add(keys[ix.programIdIndex]);
  for (const group of meta.innerInstructions) for (const ix of group.instructions) programs.add(keys[ix.programIdIndex]);
  const lending = [...programs].map(lendingLabel).find(Boolean) ?? null;
  const hasDex = [...programs].some((program) => dexLabel(program));
  const calls = transferCalls(info, keys, ctx.mints);

  // Native SOL change of the fee payer, with the fee added back.
  const feePayerSol = (Number(meta.postBalances[0] ?? 0) - Number(meta.preBalances[0] ?? 0) + Number(meta.fee)) / LAMPORTS_PER_SOL;

  /** Dollar value of everything `owner` moved in the direction given by `sign`, excluding `mint`. */
  const quoteUsd = (owner: string, mint: string, sign: 1 | -1): number => {
    let usd = 0;
    for (const [other, delta] of deltas.get(owner) ?? []) {
      if (other === mint || delta === 0n || (delta > 0n ? 1 : -1) !== sign) continue;
      if (USD_STABLES.has(other)) usd += Math.abs(Number(delta)) / 10 ** STABLE_DECIMALS;
      else if (other === WSOL && ctx.solPrice) usd += (Math.abs(Number(delta)) / LAMPORTS_PER_SOL) * ctx.solPrice;
    }
    return usd;
  };
  // Net change of each mint across every owner. A swap moves existing tokens, so its other leg
  // nets to zero. LP tokens and position NFTs are minted or burned in the transaction, so they
  // don't, and they must not count as the other side of a trade. Wrapped SOL is exempt: routers
  // wrap native SOL into a temporary account and close it, so its net is not zero either.
  const netByMint = new Map<string, bigint>();
  for (const perMint of deltas.values()) for (const [m, delta] of perMint) netByMint.set(m, (netByMint.get(m) ?? 0n) + delta);
  const hasOpposingFlow = (owner: string, mint: string, sign: 1 | -1): boolean => {
    for (const [other, delta] of deltas.get(owner) ?? []) {
      if (other === mint || delta === 0n || (delta > 0n ? 1 : -1) !== sign) continue;
      if (other !== WSOL && netByMint.get(other) !== 0n) continue;
      return true;
    }
    return owner === feePayer && Math.abs(feePayerSol) > 0.005 && Math.sign(feePayerSol) === sign;
  };
  /**
   * True when `owner` moved USDC or SOL in direction `sign`. Paired with an xStock move the same
   * way, that is liquidity: a deposit sends both and gets LP tokens back, a withdrawal receives both.
   */
  const movesCash = (owner: string, sign: 1 | -1): boolean => {
    let opposite = false;
    for (const [other, delta] of deltas.get(owner) ?? []) {
      if (delta === 0n) continue;
      const direction = delta > 0n ? 1 : -1;
      if (USD_STABLES.has(other) || other === WSOL) {
        if (direction === sign) return true;
        opposite = true;
      } else if (direction !== sign && netByMint.get(other) === 0n) {
        // Paid for with another token, for example an xStock-for-xStock swap.
        opposite = true;
      }
    }
    // Native SOL counts only when nothing else pays for the xStock, so a sell that also pays a
    // tip or account rent in SOL stays a sell.
    return !opposite && owner === feePayer && Math.abs(feePayerSol) > 0.005 && Math.sign(feePayerSol) === sign;
  };

  const events: Classified[] = [];
  const seconds = Math.floor(blockTime / 1000);

  for (const mintAddress of moved) {
    const mint = ctx.mints.get(mintAddress)!;
    const changes = [...deltas.entries()]
      .map(([owner, perMint]) => ({ owner, delta: perMint.get(mintAddress) ?? 0n }))
      .filter((change) => change.delta !== 0n);
    const net = changes.reduce((sum, change) => sum + change.delta, 0n);
    const ref = ctx.refPrice(mintAddress);
    const base = { signature, slot, t: blockTime, mint: mintAddress, symbol: mint.symbol, ref };
    const biggest = (sign: 1 | -1) =>
      changes
        .filter((change) => (change.delta > 0n ? 1 : -1) === sign)
        .sort((a, b) => Number((b.delta < 0n ? -b.delta : b.delta) - (a.delta < 0n ? -a.delta : a.delta)))[0]?.owner ?? null;

    // Mint or redeem: the changes for this mint do not add up to zero.
    if (net !== 0n) {
      const shares = rawToShares(mint, net < 0n ? -net : net, seconds);
      events.push({
        ...base,
        type: net > 0n ? "mint" : "redeem",
        shares,
        usd: ref ? shares * ref : null,
        price: null,
        venue: null,
        wallet: biggest(net > 0n ? 1 : -1) ?? feePayer,
        counterparty: null,
      });
      continue;
    }

    // Owners whose xStock change is paid for by an opposite change in another asset. An owner whose
    // USDC or SOL moves the same way as the xStock is adding or removing liquidity, not trading,
    // even though the LP token moves the opposite way.
    const paired = changes.filter((change) => {
      const sign = change.delta > 0n ? 1 : -1;
      return hasOpposingFlow(change.owner, mintAddress, sign === 1 ? -1 : 1) && !movesCash(change.owner, sign);
    });

    if (paired.length === 0 || (lending && !hasDex)) {
      // One-way movement: lending, pool liquidity, or a plain transfer.
      const sender = biggest(-1) ?? feePayer;
      const receiver = biggest(1);
      const sent = changes.filter((change) => change.delta < 0n).reduce((sum, change) => sum - change.delta, 0n);
      const shares = rawToShares(mint, sent, seconds);
      const signerSends = changes.some((change) => change.delta < 0n && signers.has(change.owner));
      const signerReceives = changes.some((change) => change.delta > 0n && signers.has(change.owner));
      let type: EventType = "transfer";
      let venue: string | null = null;
      if (lending && !hasDex) {
        type = signerReceives && !signerSends ? "lend_withdraw" : "lend_deposit";
        venue = lending;
      } else if (hasDex && signerSends !== signerReceives) {
        type = signerSends ? "lp_add" : "lp_remove";
        const others = new Set(changes.filter((change) => !signers.has(change.owner)).map((change) => change.owner));
        venue = pickVenue(calls, mintAddress, others, programs);
      }
      const outbound = type === "lend_withdraw" || type === "lp_remove";
      events.push({
        ...base,
        type,
        shares,
        usd: ref ? shares * ref : null,
        price: null,
        venue,
        wallet: outbound ? receiver ?? sender : sender,
        counterparty: type === "transfer" ? receiver : null,
      });
      continue;
    }

    // Trade. Pick the trader: a signer if one took part, else the side that is not a known pool,
    // else the smaller holder (pools hold inventory, traders usually start or end near zero).
    // A signer whose xStock moved against a paired pool is the trader even when its payment does
    // not show in token balances, for example native SOL when someone else pays the fee.
    let taker = paired.find((change) => signers.has(change.owner))
      ?? changes.find((change) => signers.has(change.owner) && paired.some((pool) => pool.delta > 0n !== change.delta > 0n));
    if (taker) {
      for (const change of paired) {
        if (change !== taker && change.delta > 0n !== taker.delta > 0n && ctx.poolOwners.size < 100_000) ctx.poolOwners.add(change.owner);
      }
    } else {
      const outsiders = paired.filter((change) => !ctx.poolOwners.has(change.owner));
      const pool = outsiders.length > 0 ? outsiders : paired;
      taker = pool.reduce((smallest, change) =>
        (held.get(`${change.owner}|${mintAddress}`) ?? 0n) < (held.get(`${smallest.owner}|${mintAddress}`) ?? 0n) ? change : smallest,
      );
    }
    const buying = taker.delta > 0n;
    const shares = rawToShares(mint, buying ? taker.delta : -taker.delta, seconds);

    // Dollar value: the trader's own stablecoin or wrapped SOL leg first, then the pool side,
    // then the fee payer's native SOL change, then the reference price.
    let usd = quoteUsd(taker.owner, mintAddress, buying ? -1 : 1);
    if (usd === 0) {
      for (const change of changes) {
        if (change.delta > 0n !== buying) usd += quoteUsd(change.owner, mintAddress, buying ? 1 : -1);
      }
    }
    if (usd === 0 && taker.owner === feePayer && ctx.solPrice && Math.abs(feePayerSol) > 0.005 && feePayerSol > 0 !== buying) {
      usd = Math.abs(feePayerSol) * ctx.solPrice;
    }
    let price: number | null = usd > 0 && shares > 0 ? usd / shares : null;
    // A price far from the reference means the quote leg was not the whole payment (for example a
    // token-to-token route). Keep the trade, value it at the reference, and leave it out of the premium.
    if (price !== null && ref && Math.abs(price / ref - 1) > 0.5) price = null;
    events.push({
      ...base,
      type: buying ? "buy" : "sell",
      shares,
      usd: price !== null ? usd : ref ? shares * ref : null,
      price,
      venue: pickVenue(calls, mintAddress, new Set(changes.filter((change) => change.delta > 0n !== buying).map((change) => change.owner)), programs),
      wallet: taker.owner,
      counterparty: null,
    });
  }
  return events;
}
