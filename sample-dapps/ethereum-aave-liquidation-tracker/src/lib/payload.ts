import { z } from 'zod';

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const hash = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const uint = z.string().regex(/^(0x[0-9a-fA-F]+|\d+)$/);
export const liquidationPayload = z.object({
  timestamp: z.number().int().positive(),
  filteredLogs: z.array(z.object({
    collateralAsset: address,
    debtAsset: address,
    user: address,
    liquidator: address,
    debtToCover: uint,
    liquidatedCollateralAmount: uint,
    receiveAToken: z.boolean(),
    transactionHash: hash.transform(value => value.toLowerCase()),
    blockHash: hash.transform(value => value.toLowerCase()),
    blockNumber: uint,
    logIndex: z.number().int().nonnegative(),
    timestamp: z.number().int().positive(),
  })).min(1),
});
export type LiquidationPayload = z.infer<typeof liquidationPayload>;
