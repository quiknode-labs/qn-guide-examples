import { useState, useEffect } from 'react';
import { Transaction, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { getExplorerUrl } from "@/utils/solana";
import { ActionPostResponse } from '@solana/actions';
import { getBase64Encoder } from '@solana/codecs-strings';

const useTransactionProcessor = (postResults?: ActionPostResponse | null) => {
    const { signTransaction } = useWallet();
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [transactionUrl, setTransactionUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const sendAndConfirm = async (serializedTx: string) => {
        if (!serializedTx) throw new Error('No transaction to send');
        const API_ENDPOINT = '/api/solana/sendAndConfirm';

        setIsLoading(true);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serializedTx }),
            });
            if (response.ok) {
                const data = await response.json();
                return data.signature;
            } else {
                setTransactionError('Failed to send and confirm Tx');
                throw new Error('Failed to send and confirm Tx');
            }
        } catch (error) {
            setTransactionError('Failed to send and confirm Tx');
            throw new Error('Failed to send and confirm Tx');
        } finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        const processTransaction = async () => {
            if (!postResults || !signTransaction) return;

            try {
                const { transaction } = postResults;
                if (!transaction) {
                    throw new Error("Failed to generate transaction");
                }

                // Thanks @Callum
                // https://solana.stackexchange.com/questions/9775/how-to-deserialize-a-magic-links-versioned-transaction
                const base64Encoder = getBase64Encoder();
                const readonlyTransactionUint8Array = base64Encoder.encode(transaction);
                const transactionUint8Array = new Uint8Array(readonlyTransactionUint8Array);
                const transactionV2 = VersionedTransaction.deserialize(transactionUint8Array);
                const txSigned = await signTransaction(transactionV2);
                const txFullSerialized = txSigned.serialize();
                const txFullBase64 = txFullSerialized.toString();
                const signature = await sendAndConfirm(txFullBase64);
                const explorerUrl = getExplorerUrl(signature);
                setTransactionUrl(explorerUrl);
            } catch (err) {
                setTransactionError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error(err);
            }
        };

        processTransaction();
    }, [postResults, signTransaction]);

    return { transactionError, transactionUrl, isLoading };
};

export default useTransactionProcessor;