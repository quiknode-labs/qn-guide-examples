import assert from "node:assert/strict";
import test from "node:test";

import fixture from "../fixtures/replay-transitions.json" with { type: "json" };
import type { ReplayBlock } from "../../src/data/types.js";
import { profileReplayBlocks } from "../../src/validation/event-profile.js";

test("profiles full fills, same-block new/remove, and recoverable cancels", () => {
  const profile = profileReplayBlocks([fixture.block as unknown as ReplayBlock]);
  assert.deepEqual(profile.bookEvents, { new: 2, update: 2, remove: 3 });
  assert.equal(profile.fullFillUpdateThenRemove, 1);
  assert.equal(profile.sameBlockNewThenRemove, 1);
  assert.deepEqual(profile.standaloneRemovals, {
    total: 1,
    uniquelyRecoverable: 1,
    unresolved: 0,
    ambiguous: 0,
    statuses: { canceled: 1 },
  });
});
