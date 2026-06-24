"use client";

import type { Connection, PublicKey } from "@solana/web3.js";
import type { TitanSwapRoute } from "./types";

export interface BuiltSwap {
  transaction: import("@solana/web3.js").VersionedTransaction;
  blockhash: string;
  lastValidBlockHeight: number;
}

/**
 * Assemble a v0 transaction from a Titan swap route.
 *
 * This is the heart of the "composable instructions" model: Titan returns the
 * raw instructions and the address lookup tables they reference, and we build,
 * sign and submit the transaction ourselves through the QuickNode RPC. No
 * priority-fee or tip injection — the focus stays on Titan's routing.
 */
export async function buildSwapTransaction(
  route: TitanSwapRoute,
  payer: PublicKey,
  connection: Connection
): Promise<BuiltSwap> {
  const {
    PublicKey: PK,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
  } = await import("@solana/web3.js");

  // Resolve the address lookup tables Titan's route depends on.
  const lookupTables = [];
  for (const addr of route.addressLookupTables) {
    const res = await connection.getAddressLookupTable(new PK(addr));
    if (res.value) lookupTables.push(res.value);
  }

  // Rebuild each instruction from the normalized (base58 / base64) form.
  const instructions = route.instructions.map(
    (ix) =>
      new TransactionInstruction({
        programId: new PK(ix.programId),
        keys: ix.accounts.map((a) => ({
          pubkey: new PK(a.pubkey),
          isSigner: a.isSigner,
          isWritable: a.isWritable,
        })),
        data: Buffer.from(ix.data, "base64"),
      })
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(lookupTables);

  return {
    transaction: new VersionedTransaction(message),
    blockhash,
    lastValidBlockHeight,
  };
}
