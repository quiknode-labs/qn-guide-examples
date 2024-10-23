import { BaseTransactionMessage, Commitment, Address, KeyPairSigner } from "@solana/web3.js";
import { PriorityFeeQuery } from "./priority-fees";

export interface SmartTransactionBaseArgs {
    instructions: ReadonlyArray<BaseTransactionMessage['instructions'][number]>;
    priorityFeeQuery?: PriorityFeeQuery;
    blockHashCommitment?: Commitment;
}

export interface PrepareSmartTransactionMessageArgs extends SmartTransactionBaseArgs {
    feePayerAddress: Address<string>;
}

export interface SendSmartTransactionArgs extends SmartTransactionBaseArgs {
    signer: KeyPairSigner<string>;
    confirmCommitment?: Commitment;
}