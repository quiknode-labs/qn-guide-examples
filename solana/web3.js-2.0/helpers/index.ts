import {
    sendAndConfirmTransactionFactory,
    signTransactionMessageWithSigners,
    getSignatureFromTransaction,
    CompilableTransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    Commitment,
} from "@solana/web3.js";


export const createSignAndSendTransaction = (sendAndConfirmTransaction: ReturnType<typeof sendAndConfirmTransactionFactory>) => {
    return async (
        transactionMessage: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime,
        commitment: Commitment = 'processed',
        skipPreflight: boolean = true
    ) => {
        const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
        try {
            await sendAndConfirmTransaction(signedTransaction, { commitment, skipPreflight });
            return getSignatureFromTransaction(signedTransaction);
        } catch (e) {
            console.error('Transaction failed:', e);
            throw e;
        }
    };
};