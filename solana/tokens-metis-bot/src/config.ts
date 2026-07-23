// Loads and validates configuration. Fail fast: any invalid or missing
// value stops the process before a single network call is made.
//
// Environment variables arrive via the runtime (`tsx --env-file=env.local`).
// This module never reads or parses an env file itself.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { LIQUIDITY_TIERS, type EnvConfig, type LiquidityTier, type Rules } from "./types.ts";

class ConfigError extends Error {
  constructor(message: string) {
    super(`Config error: ${message}`);
    this.name = "ConfigError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new ConfigError(`missing required environment variable ${name}`);
  }
  return value.trim();
}

function requireUrl(name: string): string {
  const value = requireEnv(name);
  try {
    new URL(value);
  } catch {
    throw new ConfigError(`${name} is not a valid URL: ${value}`);
  }
  // Trailing slashes cause double-slash paths when joined.
  return value.replace(/\/+$/, "");
}

function parseBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const v = raw.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  throw new ConfigError(`${name} must be "true" or "false", got: ${raw}`);
}

// Expand a leading ~ to the home directory and resolve to an absolute path.
function expandUser(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return resolve(homedir(), p.slice(2));
  return resolve(p);
}

// The wallet is a Solana CLI keypair file (JSON array of 64 bytes). Only its
// path lives in config; fail fast here if the file is missing so the error
// is a clear config error rather than a later plugin failure.
function requireWalletKeypairPath(): string {
  const abs = expandUser(requireEnv("WALLET_KEYPAIR_PATH"));
  if (!existsSync(abs)) {
    throw new ConfigError(`WALLET_KEYPAIR_PATH does not point to an existing file: ${abs}`);
  }
  return abs;
}

function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ConfigError(`${name} must be a positive integer, got: ${raw}`);
  }
  return n;
}

export function loadEnv(): EnvConfig {
  // TOKENS_API_KEY is validated for presence here but never returned; the
  // tokens client reads it from process.env directly so the secret stays out
  // of any object that might get logged or serialized.
  requireEnv("TOKENS_API_KEY");

  return {
    solanaRpcUrl: requireUrl("SOLANA_RPC_URL"),
    metisEndpoint: requireUrl("METIS_ENDPOINT"),
    tokensApiBaseUrl: requireUrl("TOKENS_API_BASE_URL"),
    walletKeypairPath: requireWalletKeypairPath(),
    // DRY_RUN defaults to true; live trading requires an explicit "false".
    dryRun: parseBool("DRY_RUN", true),
    killSwitchFile: process.env.KILL_SWITCH_FILE?.trim() || "./STOP",
    pollIntervalSeconds: parsePositiveInt("POLL_INTERVAL_SECONDS", 300),
    runOnce: parseBool("RUN_ONCE", false),
  };
}

// -- rules.json validation ---------------------------------------------------
// Hand-rolled and strict: unknown fields are rejected so a typo in rules.json
// fails loudly instead of silently falling back to a default.

function assertKeys(obj: Record<string, unknown>, allowed: string[], path: string): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      throw new ConfigError(`unknown field "${path}.${key}" in rules.json`);
    }
  }
  for (const key of allowed) {
    if (!(key in obj)) {
      throw new ConfigError(`missing field "${path}.${key}" in rules.json`);
    }
  }
}

function asObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ConfigError(`"${path}" must be an object`);
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, path: string, opts: { min?: number; integer?: boolean } = {}): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ConfigError(`"${path}" must be a finite number`);
  }
  if (opts.integer && !Number.isInteger(value)) {
    throw new ConfigError(`"${path}" must be an integer`);
  }
  if (opts.min !== undefined && value < opts.min) {
    throw new ConfigError(`"${path}" must be >= ${opts.min}`);
  }
  return value;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ConfigError(`"${path}" must be a non-empty string`);
  }
  return value;
}

function asBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new ConfigError(`"${path}" must be a boolean`);
  }
  return value;
}

// Categories accepted by the Tokens API /trending endpoint.
const KNOWN_CATEGORIES = [
  "crypto",
  "stablecoin",
  "lst",
  "rwa",
  "commodity",
  "equity",
  "etf",
  "index",
];

function asCategories(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ConfigError(`"${path}" must be a non-empty array of category strings`);
  }
  return value.map((v, i) => {
    const s = asString(v, `${path}[${i}]`);
    if (!KNOWN_CATEGORIES.includes(s)) {
      throw new ConfigError(
        `"${path}[${i}]" must be one of ${KNOWN_CATEGORIES.join(", ")}, got: ${s}`,
      );
    }
    return s;
  });
}

function asTier(value: unknown, path: string): LiquidityTier {
  const s = asString(value, path);
  if (!(LIQUIDITY_TIERS as readonly string[]).includes(s)) {
    throw new ConfigError(`"${path}" must be one of ${LIQUIDITY_TIERS.join(", ")}, got: ${s}`);
  }
  return s as LiquidityTier;
}

export function parseRules(raw: unknown): Rules {
  const root = asObject(raw, "rules");
  assertKeys(root, ["universe", "screen", "portfolio", "exit", "execution"], "rules");

  const universe = asObject(root.universe, "universe");
  assertKeys(universe, ["limit", "categories"], "universe");

  const screen = asObject(root.screen, "screen");
  assertKeys(screen, ["minLiquidityTier", "maxRiskFlags", "minVolume24hUSD", "momentum"], "screen");
  const momentum = asObject(screen.momentum, "screen.momentum");
  assertKeys(momentum, ["window", "minChangePct"], "screen.momentum");

  const portfolio = asObject(root.portfolio, "portfolio");
  assertKeys(
    portfolio,
    ["quoteMint", "maxPositions", "targetPositionSizeUSD", "maxPositionSizeUSD"],
    "portfolio",
  );

  const exit = asObject(root.exit, "exit");
  assertKeys(
    exit,
    ["sellWhenScreenFails", "takeProfitPct", "stopLossPct", "reentryCooldownMinutes"],
    "exit",
  );

  const execution = asObject(root.execution, "execution");
  assertKeys(
    execution,
    ["slippageBps", "onlyDirectRoutes", "restrictIntermediateTokens", "maxAccounts"],
    "execution",
  );

  const rules: Rules = {
    universe: {
      limit: asNumber(universe.limit, "universe.limit", { min: 1, integer: true }),
      categories: asCategories(universe.categories, "universe.categories"),
    },
    screen: {
      minLiquidityTier: asTier(screen.minLiquidityTier, "screen.minLiquidityTier"),
      maxRiskFlags: asNumber(screen.maxRiskFlags, "screen.maxRiskFlags", { min: 0, integer: true }),
      minVolume24hUSD: asNumber(screen.minVolume24hUSD, "screen.minVolume24hUSD", { min: 0 }),
      momentum: {
        window: asString(momentum.window, "screen.momentum.window"),
        minChangePct: asNumber(momentum.minChangePct, "screen.momentum.minChangePct"),
      },
    },
    portfolio: {
      quoteMint: asString(portfolio.quoteMint, "portfolio.quoteMint"),
      maxPositions: asNumber(portfolio.maxPositions, "portfolio.maxPositions", { min: 1, integer: true }),
      targetPositionSizeUSD: asNumber(portfolio.targetPositionSizeUSD, "portfolio.targetPositionSizeUSD", { min: 0 }),
      maxPositionSizeUSD: asNumber(portfolio.maxPositionSizeUSD, "portfolio.maxPositionSizeUSD", { min: 0 }),
    },
    exit: {
      sellWhenScreenFails: asBoolean(exit.sellWhenScreenFails, "exit.sellWhenScreenFails"),
      takeProfitPct: asNumber(exit.takeProfitPct, "exit.takeProfitPct", { min: 0 }),
      stopLossPct: asNumber(exit.stopLossPct, "exit.stopLossPct", { min: 0 }),
      reentryCooldownMinutes: asNumber(exit.reentryCooldownMinutes, "exit.reentryCooldownMinutes", {
        min: 0,
      }),
    },
    execution: {
      slippageBps: asNumber(execution.slippageBps, "execution.slippageBps", { min: 1, integer: true }),
      onlyDirectRoutes: asBoolean(execution.onlyDirectRoutes, "execution.onlyDirectRoutes"),
      restrictIntermediateTokens: asBoolean(
        execution.restrictIntermediateTokens,
        "execution.restrictIntermediateTokens",
      ),
      maxAccounts: asNumber(execution.maxAccounts, "execution.maxAccounts", { min: 1, integer: true }),
    },
  };

  if (rules.portfolio.maxPositionSizeUSD < rules.portfolio.targetPositionSizeUSD) {
    throw new ConfigError(
      "portfolio.maxPositionSizeUSD must be >= portfolio.targetPositionSizeUSD",
    );
  }
  if (rules.universe.limit > 50) {
    throw new ConfigError("universe.limit cannot exceed 50 (the /trending endpoint maximum)");
  }

  return rules;
}

export function loadRules(path = "rules.json"): Rules {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    throw new ConfigError(`cannot read ${path}: ${(err as Error).message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ConfigError(`${path} is not valid JSON: ${(err as Error).message}`);
  }
  return parseRules(parsed);
}
