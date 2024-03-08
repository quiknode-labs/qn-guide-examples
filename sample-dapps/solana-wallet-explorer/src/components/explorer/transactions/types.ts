import { ConfirmedSignatureInfo } from '@solana/web3.js';

export interface TransactionsResponse {
    txIds: ConfirmedSignatureInfo[];
}
