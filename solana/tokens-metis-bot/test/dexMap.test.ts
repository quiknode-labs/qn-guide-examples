import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toMetisDexes, UnmappedVenueError } from "../src/engine/dexMap.ts";
import { LABEL_MAP } from "./fixtures.ts";

describe("toMetisDexes", () => {
  it("maps the Tokens API 'Raydium Clamm' casing to Raydium CLMM", () => {
    assert.deepEqual(toMetisDexes("Raydium Clamm", LABEL_MAP), ["Raydium CLMM"]);
  });

  it("maps Orca to Whirlpool first, with legacy fallbacks that exist", () => {
    assert.deepEqual(toMetisDexes("Orca", LABEL_MAP), ["Whirlpool", "Orca V2"]);
  });

  it("passes through an exact label match case-insensitively", () => {
    assert.deepEqual(toMetisDexes("phoenix", LABEL_MAP), ["Phoenix"]);
    assert.deepEqual(toMetisDexes("Meteora DLMM", LABEL_MAP), ["Meteora DLMM"]);
  });

  it("prefers the direct match, then adds alias expansions", () => {
    assert.deepEqual(toMetisDexes("Meteora", LABEL_MAP), ["Meteora", "Meteora DLMM"]);
  });

  it("throws UnmappedVenueError on an unknown venue", () => {
    assert.throws(() => toMetisDexes("MysteryDex 9000", LABEL_MAP), UnmappedVenueError);
    assert.throws(() => toMetisDexes("MysteryDex 9000", LABEL_MAP), /route anywhere|unrestricted/i);
  });

  it("throws when aliases exist but none are live in the label map", () => {
    // Lifinity V2 is aliased but absent from this label map slice.
    assert.throws(() => toMetisDexes("Lifinity", LABEL_MAP), UnmappedVenueError);
  });

  it("never returns an empty allowlist", () => {
    // Guard against the failure mode the spec calls out: an empty dexes
    // list means "route anywhere" on Metis.
    for (const venue of ["Orca", "Saber", "Raydium Clamm", "Cropper"]) {
      if (venue === "Cropper") {
        // Not in this label-map slice: must throw, not return [].
        assert.throws(() => toMetisDexes(venue, LABEL_MAP));
      } else {
        assert.ok(toMetisDexes(venue, LABEL_MAP).length > 0);
      }
    }
  });
});
