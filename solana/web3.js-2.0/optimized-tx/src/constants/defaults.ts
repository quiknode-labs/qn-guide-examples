import { Blockhash } from "@solana/kit";

export const DEFAULTS = {
    PLACEHOLDER_BLOCKHASH: {
        blockhash: '11111111111111111111111111111111' as Blockhash,
        lastValidBlockHeight: 0n,
    } as const,
    PLACEHOLDER_COMPUTE_UNIT: 1_400_000,
    PLACEHOLDER_PRIORITY_FEE: 1,
    DEFAULT_COMPUTE_MARGIN: 1.05
} as const;
