import { useState, useEffect, useCallback } from 'react';
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { getExplorerUrl } from "@/utils/solana";
import { ActionPostResponse } from '@solana/actions';
import { getBase64Encoder } from '@solana/codecs-strings';

const useTransactionProcessor = (postResults?: ActionPostResponse | null) => {
    const { signTransaction } = useWallet();
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [transactionUrl, setTransactionUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const sendAndConfirm = useCallback(async (serializedTx: string): Promise<string> => {
        if (!serializedTx) throw new Error('No transaction to send');
        const API_ENDPOINT = '/api/solana/sendAndConfirm';

        setIsLoading(true);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serializedTx }),
            });
            if (!response.ok) {
                throw new Error('Failed to send and confirm Tx');
            }
            const data = await response.json();
            return data.signature;
        } catch (error) {
            setTransactionError('Failed to send and confirm Tx');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const processLegacyTransaction = useCallback(async (transaction: string): Promise<string> => {
        if (!signTransaction) throw new Error('Wallet not connected');
        
        const txPartial = Transaction.from(Buffer.from(transaction, 'base64'));
        const txSigned = await signTransaction(txPartial);
        const txFullSerialized = txSigned.serialize({ requireAllSignatures: true });
        const txFullBase64 = txFullSerialized.toString('base64');
        return await sendAndConfirm(txFullBase64);
    }, [signTransaction, sendAndConfirm]);

    const processVersionedTransaction = useCallback(async (transaction: string): Promise<string> => {
        if (!signTransaction) throw new Error('Wallet not connected');
        
        const base64Encoder = getBase64Encoder();
        const transactionUint8Array = new Uint8Array(base64Encoder.encode(transaction));
        const transactionV2 = VersionedTransaction.deserialize(transactionUint8Array);
        const txSigned = await signTransaction(transactionV2);
        const txFullSerialized = txSigned.serialize();
        const txFullBase64 = Buffer.from(txFullSerialized).toString('base64');
        return await sendAndConfirm(txFullBase64);
    }, [signTransaction, sendAndConfirm]);

    useEffect(() => {
        const processTransaction = async () => {
            if (!postResults?.transaction || !signTransaction) return;

            try {
                let signature: string;
                try {
                    signature = await processLegacyTransaction(postResults.transaction);
                } catch (err) {
                    if (err instanceof Error && err.message.includes('VersionedMessage.deserialize()')) {
                        signature = await processVersionedTransaction(postResults.transaction);
                    } else {
                        throw err;
                    }
                }
                const explorerUrl = getExplorerUrl(signature);
                setTransactionUrl(explorerUrl);
            } catch (err) {
                setTransactionError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error(err);
            }
        };

        processTransaction();
    }, [postResults, signTransaction, processLegacyTransaction, processVersionedTransaction]);

    return { transactionError, transactionUrl, isLoading };
};

export default useTransactionProcessor;