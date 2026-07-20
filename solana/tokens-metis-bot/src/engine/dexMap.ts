// Pure venue-name translation: Tokens API market `source` labels (human
// names like "Orca" or "Raydium Clamm") -> Metis `dexes` labels (the values
// of GET /program-id-to-label, like "Whirlpool" or "Raydium CLMM").
//
// The two systems do not share naming, so an explicit alias table maps each
// known Tokens API venue to the Metis labels it can execute on. An unmapped
// venue throws: silently sending an empty `dexes` list would mean "route
// anywhere," which defeats the venue pinning.

function normalize(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Keys are normalized Tokens API venue names; values are Metis label
// spellings (verified against the live program-id-to-label sample).
// Extend this table as new venues show up in Tokens API market data.
const VENUE_ALIASES: Record<string, string[]> = {
  // Orca pools quote through Whirlpool on Jupiter; keep the legacy labels
  // as fallbacks in case the market is on an old pool.
  orca: ["Whirlpool", "Orca V2", "Orca V1"],
  whirlpool: ["Whirlpool"],
  raydium: ["Raydium"],
  "raydium clamm": ["Raydium CLMM"],
  "raydium clmm": ["Raydium CLMM"],
  "raydium cp": ["Raydium CP"],
  "raydium cpmm": ["Raydium CP"],
  meteora: ["Meteora", "Meteora DLMM"],
  "meteora dlmm": ["Meteora DLMM"],
  "pump fun": ["Pump.fun Amm", "Pump.fun"],
  pumpfun: ["Pump.fun Amm", "Pump.fun"],
  openbook: ["OpenBook V2", "Openbook"],
  lifinity: ["Lifinity V2"],
  phoenix: ["Phoenix"],
  saber: ["Saber"],
  cropper: ["Cropper"],
  fluxbeam: ["FluxBeam"],
  invariant: ["Invariant"],
  sanctum: ["Sanctum", "Sanctum Infinity"],
  solfi: ["SolFi"],
  zerofi: ["ZeroFi"],
};

export class UnmappedVenueError extends Error {
  constructor(venueLabel: string) {
    super(
      `No Metis dexes mapping for Tokens API venue "${venueLabel}". ` +
        `Add it to VENUE_ALIASES in engine/dexMap.ts rather than routing unrestricted.`,
    );
    this.name = "UnmappedVenueError";
  }
}

// labelMap is the raw response of GET /program-id-to-label:
// { programId: label }. Returns Metis labels in the map's canonical spelling,
// filtered to labels Metis actually reports, ordered by alias preference.
export function toMetisDexes(venueLabel: string, labelMap: Record<string, string>): string[] {
  const wanted = normalize(venueLabel);
  const canonicalByNormalized = new Map<string, string>();
  for (const label of Object.values(labelMap)) {
    if (!canonicalByNormalized.has(normalize(label))) {
      canonicalByNormalized.set(normalize(label), label);
    }
  }

  const candidates: string[] = [];

  // Exact (normalized) match against a live Metis label wins outright.
  const direct = canonicalByNormalized.get(wanted);
  if (direct) candidates.push(direct);

  // Then the alias table, keeping only labels Metis currently reports.
  for (const alias of VENUE_ALIASES[wanted] ?? []) {
    const canonical = canonicalByNormalized.get(normalize(alias));
    if (canonical && !candidates.includes(canonical)) candidates.push(canonical);
  }

  if (candidates.length === 0) {
    throw new UnmappedVenueError(venueLabel);
  }
  return candidates;
}
