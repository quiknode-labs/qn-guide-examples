"use client";

import {
  type Address,
  type AddressesByLookupTableAddress,
  type Rpc,
  type SolanaRpcApi,
  type TransactionSigner,
  AccountRole,
  address,
  appendTransactionMessageInstructions,
  compressTransactionMessageUsingAddressLookupTables,
  createTransactionMessage,
  getAddressDecoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import type { TitanSwapRoute } from "./types";

export interface BuiltSwap {
  /** A Kit transaction message ready to be signed with `signTransactionMessageWithSigners`. */
  message: Parameters<typeof signTransactionMessageWithSigners>[0];
  lastValidBlockHeight: number;
}

// An address lookup table account is a fixed 56-byte metadata header followed
// by a packed array of 32-byte addresses.
const LOOKUP_TABLE_META_SIZE = 56;

// Titan returns a route's swap instructions without a compute-unit limit and
// reports the units the route needs in `computeUnitsSafe`. Without an explicit
// limit the transaction runs at the 200k default, which a multi-hop route
// exceeds — the program then aborts with "Program failed to complete". We
// prepend a SetComputeUnitLimit instruction built from `computeUnitsSafe`.
const COMPUTE_BUDGET_PROGRAM_ID = "ComputeBudget111111111111111111111111111111";
const MAX_COMPUTE_UNITS = 1_400_000;
const DEFAULT_COMPUTE_UNITS = 600_000;

/** Build a ComputeBudget `SetComputeUnitLimit` instruction (discriminator 2, u32 LE units). */
function setComputeUnitLimitInstruction(units: number) {
  const data = new Uint8Array(5);
  data[0] = 2;
  new DataView(data.buffer).setUint32(1, Math.min(units, MAX_COMPUTE_UNITS), true);
  return { programAddress: address(COMPUTE_BUDGET_PROGRAM_ID), accounts: [], data };
}

function decodeLookupTableAddresses(data: Uint8Array): Address[] {
  const decoder = getAddressDecoder();
  const addresses: Address[] = [];
  for (let o = LOOKUP_TABLE_META_SIZE; o + 32 <= data.length; o += 32) {
    addresses.push(decoder.decode(data.subarray(o, o + 32)));
  }
  return addresses;
}

/** Map an account's signer/writable bits to a Kit AccountRole. */
function accountRole(a: { isSigner: boolean; isWritable: boolean }): AccountRole {
  if (a.isWritable) {
    return a.isSigner ? AccountRole.WRITABLE_SIGNER : AccountRole.WRITABLE;
  }
  return a.isSigner ? AccountRole.READONLY_SIGNER : AccountRole.READONLY;
}

/**
 * Assemble a v0 transaction message from a Titan swap route, using @solana/kit.
 *
 * This is the heart of the "composable instructions" model: Titan returns the
 * raw instructions and the address lookup tables they reference, and we build
 * the transaction ourselves through the Quicknode RPC. No priority-fee or tip
 * injection — the focus stays on Titan's routing.
 *
 * The fee payer is the wallet's Kit `TransactionSigner`, so the returned message
 * can be signed directly with `signTransactionMessageWithSigners` — no web3.js.
 */
export async function buildSwapTransaction(
  route: TitanSwapRoute,
  feePayer: TransactionSigner,
  rpc: Rpc<SolanaRpcApi>
): Promise<BuiltSwap> {
  // Resolve the address lookup tables Titan's route depends on (in parallel).
  const lookupTables: AddressesByLookupTableAddress = {};
  await Promise.all(
    route.addressLookupTables.map(async (addr) => {
      const { value } = await rpc
        .getAccountInfo(address(addr), { encoding: "base64" })
        .send();
      if (value) {
        const raw = new Uint8Array(Buffer.from(value.data[0], "base64"));
        lookupTables[address(addr)] = decodeLookupTableAddresses(raw);
      }
    })
  );

  // Rebuild each instruction from the normalized (base58 / base64) form.
  const swapInstructions = route.instructions.map((ix) => ({
    programAddress: address(ix.programId),
    accounts: ix.accounts.map((a) => ({
      address: address(a.pubkey),
      role: accountRole(a),
    })),
    data: new Uint8Array(Buffer.from(ix.data, "base64")),
  }));

  // Set the compute-unit limit from the route's reported needs (with a small
  // buffer), unless the route already includes its own ComputeBudget instruction.
  const hasComputeBudget = route.instructions.some(
    (ix) => ix.programId === COMPUTE_BUDGET_PROGRAM_ID
  );
  const units = route.computeUnitsSafe
    ? Math.ceil(route.computeUnitsSafe * 1.1)
    : DEFAULT_COMPUTE_UNITS;
  const instructions = hasComputeBudget
    ? swapInstructions
    : [setComputeUnitLimitInstruction(units), ...swapInstructions];

  const { value: latestBlockhash } = await rpc
    .getLatestBlockhash({ commitment: "confirmed" })
    .send();

  // Build the v0 message and compress its accounts through the lookup tables.
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(feePayer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions(instructions, m),
    (m) => compressTransactionMessageUsingAddressLookupTables(m, lookupTables)
  );

  return {
    message,
    lastValidBlockHeight: Number(latestBlockhash.lastValidBlockHeight),
  };
}
