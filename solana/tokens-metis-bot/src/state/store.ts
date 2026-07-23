// Position state behind an interface so SQLite can replace the JSON file
// later without touching callers.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Position } from "../types.ts";

export interface StateStore {
  load(): Promise<void>;
  getPositions(): Position[];
  upsertPosition(position: Position): void;
  removePosition(assetId: string): void;
  // Re-entry cooldowns: assetId -> unix ms of the sell that started it.
  getCooldowns(): Record<string, number>;
  setCooldown(assetId: string, ts: number): void;
  clearCooldown(assetId: string): void;
  save(): Promise<void>;
}

interface StateFile {
  version: 1;
  positions: Position[];
  cooldowns?: Record<string, number>;
}

export function createJsonStateStore(filePath = join("data", "state.json")): StateStore {
  let positions = new Map<string, Position>();
  let cooldowns: Record<string, number> = {};

  return {
    async load(): Promise<void> {
      let raw: string;
      try {
        raw = readFileSync(filePath, "utf8");
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          positions = new Map();
          cooldowns = {};
          return; // first run, nothing persisted yet
        }
        throw err;
      }
      const parsed = JSON.parse(raw) as StateFile;
      if (parsed.version !== 1 || !Array.isArray(parsed.positions)) {
        throw new Error(`Unrecognized state file format in ${filePath}`);
      }
      positions = new Map(parsed.positions.map((p) => [p.assetId, p]));
      cooldowns = { ...parsed.cooldowns };
    },

    getPositions(): Position[] {
      return [...positions.values()];
    },

    upsertPosition(position: Position): void {
      positions.set(position.assetId, position);
    },

    removePosition(assetId: string): void {
      positions.delete(assetId);
    },

    getCooldowns(): Record<string, number> {
      return { ...cooldowns };
    },

    setCooldown(assetId: string, ts: number): void {
      cooldowns[assetId] = ts;
    },

    clearCooldown(assetId: string): void {
      delete cooldowns[assetId];
    },

    // Atomic write: temp file then rename, so a crash mid-write cannot
    // corrupt the state file.
    async save(): Promise<void> {
      const state: StateFile = { version: 1, positions: [...positions.values()], cooldowns };
      mkdirSync(dirname(filePath), { recursive: true });
      const tmpPath = `${filePath}.tmp`;
      writeFileSync(tmpPath, JSON.stringify(state, null, 2) + "\n", "utf8");
      renameSync(tmpPath, filePath);
    },
  };
}
