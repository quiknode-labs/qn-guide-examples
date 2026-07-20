// Trade execution: market selection, venue mapping, sizing, quote, swap.
// Every safety cap is enforced here, immediately before money moves.

import type { Rules, TradeDecision } from "../types.ts";
import type { MetisClient } from "../clients/metis.ts";
import type { TokensClient } from "../clients/tokens.ts";
import type { RpcClient } from "../clients/rpc.ts";
import type { StateStore } from "../state/store.ts";
import type { Logger } from "../log/logger.ts";
import { toMetisDexes } from "../engine/dexMap.ts";

// Refuse any swap whose quoted price impact exceeds this, regardless of
// slippage tolerance. A trade this size moving the pool this much means
// the market is thinner than the screen believed.
const MAX_PRICE_IMPACT_PCT = 2.5;

export interface ExecutorDeps {
  tokens: TokensClient;
  metis: MetisClient;
  rpc: RpcClient;
  store: StateStore;
  logger: Logger;
  rules: Rules;
  dryRun: boolean;
}

export interface Executor {
  run(decision: TradeDecision): Promise<void>;
}

export function createExecutor(deps: ExecutorDeps): Executor {
  const { tokens, metis, rpc, store, logger, rules, dryRun } = deps;

  async function sizeBuyInQuoteBaseUnits(): Promise<string | null> {
    // The quote mint is assumed to be a USD stablecoin, so USD sizes map
    // 1:1 to quote-mint UI amounts.
    const target = Math.min(rules.portfolio.targetPositionSizeUSD, rules.portfolio.maxPositionSizeUSD);
    const targetBase = BigInt(await rpc.toBaseUnits(target, rules.portfolio.quoteMint));

    const balances = await rpc.getBalances(rpc.walletAddress);
    const quoteBalance = balances.tokens.find((t) => t.mint === rules.portfolio.quoteMint);
    const available = BigInt(quoteBalance?.amountBaseUnits ?? "0");

    if (available <= 0n) {
      // Dry run is hypothetical: size at the target so the intended trade can
      // still be quoted and logged without the wallet holding any quote mint.
      // Live trading requires a real balance.
      if (dryRun) return targetBase.toString();
      return null;
    }
    // Never size above the cap or above the actual balance.
    return (targetBase < available ? targetBase : available).toString();
  }

  async function run(decision: TradeDecision): Promise<void> {
    const { candidate, action } = decision;

    // 1. Best market for the chosen variant.
    const markets = await tokens.getMarkets(candidate.assetId, { mint: candidate.chosenMint });
    const best = markets[0];
    if (!best) {
      logger.warn(`No market found, skipping ${action}`, { symbol: candidate.symbol });
      return;
    }

    // 2. Venue -> Metis dexes allowlist. Throws on an unmapped venue.
    const labelMap = await metis.programIdToLabel();
    const dexes = toMetisDexes(best.venueLabel, labelMap);

    // 3. Size the trade.
    let inputMint: string;
    let outputMint: string;
    let amountBaseUnits: string;

    if (action === "buy") {
      inputMint = rules.portfolio.quoteMint;
      outputMint = candidate.chosenMint;
      const size = await sizeBuyInQuoteBaseUnits();
      if (size === null || size === "0") {
        logger.warn("No quote-mint balance available, skipping buy", { symbol: candidate.symbol });
        return;
      }
      amountBaseUnits = size;
    } else {
      inputMint = candidate.chosenMint;
      outputMint = rules.portfolio.quoteMint;
      const position = store.getPositions().find((p) => p.assetId === candidate.assetId);
      if (!position) {
        logger.warn("Sell decision for unknown position, skipping", { symbol: candidate.symbol });
        return;
      }
      // Clamp to the actual wallet balance in case of external transfers.
      const balances = await rpc.getBalances(rpc.walletAddress);
      const walletAmount = BigInt(
        balances.tokens.find((t) => t.mint === position.mint)?.amountBaseUnits ?? "0",
      );
      const positionAmount = BigInt(position.amountBaseUnits);
      const sellAmount = walletAmount < positionAmount ? walletAmount : positionAmount;
      if (sellAmount <= 0n) {
        logger.warn("Position has no wallet balance, removing from state", {
          symbol: candidate.symbol,
        });
        store.removePosition(candidate.assetId);
        return;
      }
      amountBaseUnits = sellAmount.toString();
    }

    // 4. Quote, with the price-impact ceiling enforced before any swap.
    const quote = await metis.quote({ inputMint, outputMint, amountBaseUnits, dexes });
    const priceImpact = Number(quote.priceImpactPct) * 100; // Metis reports a fraction
    if (!Number.isFinite(priceImpact) || priceImpact > MAX_PRICE_IMPACT_PCT) {
      logger.warn("Quoted price impact exceeds ceiling, refusing swap", {
        symbol: candidate.symbol,
        priceImpactPct: quote.priceImpactPct,
        ceilingPct: MAX_PRICE_IMPACT_PCT,
      });
      return;
    }

    const logBase = {
      ts: new Date().toISOString(),
      action,
      assetId: candidate.assetId,
      symbol: candidate.symbol,
      mint: candidate.chosenMint,
      venue: best.venueLabel,
      dexes,
      quotedOutAmount: quote.outAmount,
      slippageBps: rules.execution.slippageBps,
      priceImpactPct: quote.priceImpactPct,
      liquidityTier: candidate.liquidityTier,
      riskFlagCount: candidate.riskFlagCount,
      momentumPct: candidate.momentumPct,
      momentumBasis: candidate.momentumBasis,
      reason: decision.reason,
      reliableAmms: metis.reliableAmms(quote),
    };

    // 5. Dry run: log the intended trade and stop. State stays untouched.
    if (dryRun) {
      logger.trade({ ...logBase, dryRun: true, actualOutAmount: null, signature: null });
      return;
    }

    const swap = await metis.swap(quote, rpc.walletAddress);
    const sig = await rpc.signAndSend(swap.swapTransaction);

    if (action === "buy") {
      const outUi = await rpc.fromBaseUnits(quote.outAmount, candidate.chosenMint);
      const inUi = await rpc.fromBaseUnits(amountBaseUnits, rules.portfolio.quoteMint);
      store.upsertPosition({
        assetId: candidate.assetId,
        symbol: candidate.symbol,
        mint: candidate.chosenMint,
        amountBaseUnits: quote.outAmount,
        entryPriceUSD: outUi > 0 ? inUi / outUi : 0,
        entryTs: Date.now(),
        entryVenue: best.venueLabel,
        entryLiquidityTier: candidate.liquidityTier,
        entryRiskFlagCount: candidate.riskFlagCount,
      });
    } else {
      store.removePosition(candidate.assetId);
    }

    logger.trade({ ...logBase, dryRun: false, actualOutAmount: quote.outAmount, signature: sig });
  }

  return { run };
}
