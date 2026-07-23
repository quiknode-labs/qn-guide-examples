// Entrypoint: config, safety banner, kill switch, and the poll loop.
//
// Run a single cycle:  RUN_ONCE=true tsx --env-file=env.local src/index.ts
// Run the loop:        tsx --env-file=env.local src/index.ts

import { existsSync } from "node:fs";
import { loadEnv, loadRules } from "./config.ts";
import { createTokensClient, countRiskFlags, momentumFromSnapshot } from "./clients/tokens.ts";
import type { TrendingEntry } from "./clients/tokens.ts";
import { createMetisClient, type MetisClient } from "./clients/metis.ts";
import { createRpcClient, type RpcClient } from "./clients/rpc.ts";
import { screenWithReasons, type ScreenRejection } from "./engine/screen.ts";
import { diff } from "./engine/diff.ts";
import { evaluateExit } from "./engine/exits.ts";
import { createExecutor } from "./exec/executor.ts";
import { createJsonStateStore } from "./state/store.ts";
import { createLogger } from "./log/logger.ts";
import type { Candidate, Position, Rules, TradeDecision } from "./types.ts";

const logger = createLogger();

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

interface AssetResolution {
  candidate: Candidate | null; // null when the asset cannot trade at all
  preScreenReasons: string[]; // non-empty when candidate is synthesized
  failed: boolean; // data fetch failed; make no decision on this asset
  entry: TrendingEntry;
}

// Resolve one trending entry into a screening candidate: confirm the
// canonical asset id, count risk flags, and choose the best variant at or
// above the tier floor.
async function resolveEntry(
  entry: TrendingEntry,
  tokens: ReturnType<typeof createTokensClient>,
  rules: Rules,
): Promise<AssetResolution> {
  try {
    const resolved = await tokens.resolve({ mint: entry.mint });
    if (resolved.assetId !== entry.assetId) {
      // Mint does not resolve to the asset trending claims: spoof guard.
      return {
        candidate: null,
        preScreenReasons: [
          `mint resolves to ${resolved.assetId}, trending claims ${entry.assetId}`,
        ],
        failed: false,
        entry,
      };
    }

    const variants = await tokens.getVariants(entry.assetId, {
      minLiquidityTier: rules.screen.minLiquidityTier,
    });

    const chosen = variants[0];
    if (!chosen) {
      return {
        candidate: null,
        preScreenReasons: [`no variant at or above tier floor ${rules.screen.minLiquidityTier}`],
        failed: false,
        entry,
      };
    }

    // Assess risk on the variant the bot would actually trade, not the
    // trending mint (they can differ when an asset has several variants).
    const risk = await tokens.getRiskSummary(chosen.mint);
    const momentum = momentumFromSnapshot(entry.market, rules.screen.momentum.window);
    return {
      candidate: {
        assetId: entry.assetId,
        symbol: entry.symbol,
        chosenMint: chosen.mint,
        liquidityTier: chosen.liquidityTier,
        riskFlagCount: countRiskFlags(risk),
        volume24hUSD: entry.market.volume24hUSD ?? 0,
        momentumPct: momentum.momentumPct,
        momentumBasis: momentum.momentumBasis,
      },
      preScreenReasons: [],
      failed: false,
      entry,
    };
  } catch (err) {
    logger.warn("Asset resolution failed, skipping", {
      symbol: entry.symbol,
      assetId: entry.assetId,
      error: (err as Error).message,
    });
    return { candidate: null, preScreenReasons: [], failed: true, entry };
  }
}

function candidateFromPosition(p: Position): Candidate {
  return {
    assetId: p.assetId,
    symbol: p.symbol,
    chosenMint: p.mint,
    liquidityTier: p.entryLiquidityTier,
    riskFlagCount: p.entryRiskFlagCount,
    volume24hUSD: 0,
    momentumPct: 0,
    momentumBasis: "n/a",
  };
}

// Price-based exits for held positions. For each position, quote selling the
// whole thing to the quote mint, routed freely across any DEX for the best
// exit price, and compare the executable value to the entry cost. Network
// happens here; the take-profit / stop-loss decision itself is pure.
async function evaluatePriceExits(
  held: Position[],
  metis: MetisClient,
  rpc: RpcClient,
  rules: Rules,
): Promise<TradeDecision[]> {
  const decisions: TradeDecision[] = [];
  for (const position of held) {
    try {
      const quote = await metis.quote({
        inputMint: position.mint,
        outputMint: rules.portfolio.quoteMint,
        amountBaseUnits: position.amountBaseUnits,
        dexes: [], // free routing: best exit price
      });
      const currentExitUSD = await rpc.fromBaseUnits(quote.outAmount, rules.portfolio.quoteMint);
      const tokensUi = await rpc.fromBaseUnits(position.amountBaseUnits, position.mint);
      const entryCostUSD = tokensUi * position.entryPriceUSD;

      const exit = evaluateExit(entryCostUSD, currentExitUSD, rules);
      if (!exit) continue;

      const pnl = exit.pnlPct >= 0 ? `+${exit.pnlPct.toFixed(2)}` : exit.pnlPct.toFixed(2);
      decisions.push({
        action: "sell",
        candidate: candidateFromPosition(position),
        reason:
          `${exit.exit} ${pnl}% ` +
          `(entry $${entryCostUSD.toFixed(4)} -> now $${currentExitUSD.toFixed(4)})`,
      });
    } catch (err) {
      // A quote failure must never trigger a sell; skip this position.
      logger.warn("Price-exit check failed, skipping", {
        symbol: position.symbol,
        error: (err as Error).message,
      });
    }
  }
  return decisions;
}

async function main(): Promise<void> {
  const env = loadEnv();
  const rules = loadRules();

  const rpc = await createRpcClient(env.solanaRpcUrl, env.metisEndpoint, env.walletKeypairPath);
  const tokens = createTokensClient(env.tokensApiBaseUrl);
  const metis = createMetisClient(rpc.rpc, rules);
  const store = createJsonStateStore();
  await store.load();
  const executor = createExecutor({
    tokens,
    metis,
    rpc,
    store,
    logger,
    rules,
    dryRun: env.dryRun,
  });

  // Safety banner: mode and wallet are always visible at startup.
  logger.info("".padEnd(60, "="));
  logger.info(env.dryRun ? "MODE: DRY RUN (no trades will be placed)" : "MODE: LIVE TRADING");
  logger.info(`Wallet: ${rpc.walletAddress}`);
  logger.info(`Rules: max ${rules.portfolio.maxPositions} positions, ` +
    `$${rules.portfolio.targetPositionSizeUSD} target size, ` +
    `${rules.execution.slippageBps} bps slippage`);
  logger.info("".padEnd(60, "="));

  const killSwitchTripped = (): boolean => existsSync(env.killSwitchFile);

  if (killSwitchTripped()) {
    logger.warn(`Kill switch file ${env.killSwitchFile} exists, exiting without trading`);
    return;
  }

  let running = true;
  while (running) {
    const cycleStart = Date.now();
    try {
      // 1. Universe.
      const trending = await tokens.getTrending({
        limit: rules.universe.limit,
        categories: rules.universe.categories,
      });
      logger.info(
        `Cycle start: ${trending.length} trending assets ` +
          `(categories: ${rules.universe.categories.join(", ")})`,
      );

      // 2. Resolve and screen.
      const resolutions = await mapWithConcurrency(trending, 5, (entry) =>
        resolveEntry(entry, tokens, rules),
      );
      const candidates = resolutions
        .map((r) => r.candidate)
        .filter((c): c is Candidate => c !== null);
      const { passing, rejected } = screenWithReasons(candidates, rules);

      // Assets that never became candidates still need rejection records so
      // a held position in that state sells with an accurate reason.
      const preScreenRejections: ScreenRejection[] = resolutions
        .filter((r) => r.candidate === null && !r.failed && r.preScreenReasons.length > 0)
        .map((r) => ({
          candidate: {
            assetId: r.entry.assetId,
            symbol: r.entry.symbol,
            chosenMint: r.entry.mint,
            liquidityTier: "tier3",
            riskFlagCount: 0,
            volume24hUSD: r.entry.market.volume24hUSD ?? 0,
            momentumPct: 0,
            momentumBasis: "unavailable",
          },
          reasons: r.preScreenReasons,
        }));

      // 3. Diff against held positions. Positions whose data fetch failed
      // this cycle are withheld from the diff so a transient API error can
      // never trigger a sell.
      const failedAssetIds = new Set(resolutions.filter((r) => r.failed).map((r) => r.entry.assetId));
      const held = store.getPositions().filter((p) => !failedAssetIds.has(p.assetId));

      // Re-entry cooldowns: assets sold recently are blocked from re-buying
      // for the configured window. Prune expired (or disabled) entries.
      const now = Date.now();
      const cooldownMs = rules.exit.reentryCooldownMinutes * 60_000;
      const cooldowns = store.getCooldowns();
      const cooldownAssetIds = new Set<string>();
      for (const [assetId, ts] of Object.entries(cooldowns)) {
        if (cooldownMs > 0 && now - ts < cooldownMs) cooldownAssetIds.add(assetId);
        else store.clearCooldown(assetId);
      }

      // Price-based exits (take-profit / stop-loss) take priority over the
      // screen: a stop-loss must fire even if the asset still passes.
      const priceExits = await evaluatePriceExits(held, metis, rpc, rules);
      const priceExitIds = new Set(priceExits.map((d) => d.candidate.assetId));

      // Screen-based decisions, minus any sell a price exit already covers.
      const screenDecisions = diff(
        passing,
        held,
        rules,
        [...rejected, ...preScreenRejections],
        cooldownAssetIds,
      ).filter((d) => !(d.action === "sell" && priceExitIds.has(d.candidate.assetId)));
      const decisions = [...priceExits, ...screenDecisions];

      // Funnel breakdown, so it is clear where assets drop out of the screen.
      logger.info(
        `Funnel: ${trending.length} pulled -> ${failedAssetIds.size} fetch-error, ` +
          `${preScreenRejections.length} no-variant, ${candidates.length} screened ` +
          `(${passing.length} passing, ${rejected.length} rejected); ` +
          `held ${held.length}; decisions: ${decisions.length}`,
      );
      // Per-asset outcomes as TICKER: ACTION - reason. Buys and sells are
      // logged by the executor via logger.trade; here we surface the no-trade
      // outcomes so a quiet cycle is still explained.
      for (const r of rejected) {
        logger.info(`${r.candidate.symbol}: REJECT - ${r.reasons.join("; ")}`);
      }
      for (const r of preScreenRejections) {
        logger.info(`${r.candidate.symbol}: DROP - ${r.reasons.join("; ")}`);
      }
      const heldAssetIds = new Set(held.map((p) => p.assetId));
      for (const c of passing) {
        if (heldAssetIds.has(c.assetId) && !priceExitIds.has(c.assetId)) {
          logger.info(`${c.symbol}: HOLD - already holding, still passes screen`);
        } else if (cooldownAssetIds.has(c.assetId) && !heldAssetIds.has(c.assetId)) {
          const remainingMin = Math.ceil((cooldownMs - (now - cooldowns[c.assetId]!)) / 60_000);
          logger.info(`${c.symbol}: COOLDOWN - re-entry blocked, ${remainingMin}m left`);
        }
      }

      // 4. Execute sequentially; one failed trade does not stop the rest.
      for (const decision of decisions) {
        if (killSwitchTripped()) {
          logger.warn("Kill switch tripped mid-cycle, stopping execution");
          break;
        }
        try {
          await executor.run(decision);
        } catch (err) {
          logger.error(`Trade execution failed`, {
            action: decision.action,
            symbol: decision.candidate.symbol,
            error: (err as Error).message,
          });
        }
      }

      // 5. Persist state.
      await store.save();
    } catch (err) {
      logger.error("Cycle failed", { error: (err as Error).message });
    }

    if (env.runOnce) {
      logger.info("RUN_ONCE set, exiting after one cycle");
      running = false;
      continue;
    }

    const elapsed = Date.now() - cycleStart;
    const sleepMs = Math.max(0, env.pollIntervalSeconds * 1_000 - elapsed);
    logger.info(`Sleeping ${(sleepMs / 1_000).toFixed(0)}s until next cycle`);
    await new Promise((resolve) => setTimeout(resolve, sleepMs));

    if (killSwitchTripped()) {
      logger.warn(`Kill switch file ${env.killSwitchFile} exists, exiting`);
      running = false;
    }
  }
}

main().catch((err) => {
  logger.error("Fatal", { error: (err as Error).message });
  process.exitCode = 1;
});
