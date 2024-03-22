import React, { FC, useCallback, useState } from 'react';
import { Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import type { Keypair, PublicKey, TransactionSignature } from '@solana/web3.js';
import { getExplorerUrl, shortenHash } from '@/utils/utils';
import { Toaster, toast } from 'sonner';
import { cluster } from '@/utils/constants';

type SendTransactionTemplateProps = {
    transactionInstructions: TransactionInstruction[];
    buttonLabel: string;
    extraSigners?: Keypair[];
    feePayer?: PublicKey;
    invisible?: boolean;
    width?: number;
    onSuccess?: () => void;
};


export const SendTransactionTemplate: FC<SendTransactionTemplateProps> = ({ transactionInstructions, buttonLabel, extraSigners, feePayer, width, invisible = false, onSuccess }) => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [isLoading, setIsLoading] = useState(false);

    const onClick = useCallback(async () => {
        try {
            if (!publicKey) throw new Error('Wallet not connected!');
            setIsLoading(true);

            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight },
            } = await connection.getLatestBlockhashAndContext();

            const transaction = new Transaction().add(...transactionInstructions);
            transaction.recentBlockhash = blockhash;
            if (feePayer) {transaction.feePayer = feePayer}
            else {transaction.feePayer = publicKey}
            if (extraSigners) transaction.partialSign(...extraSigners);
            if (feePayer && extraSigners) {
                let signature = await sendAndConfirmTransaction(connection, transaction, extraSigners);
                const url = getExplorerUrl(signature, cluster);
                await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
                toast.success(<div><a href={url} target='_blank' rel='noreferrer'>Success! {shortenHash(signature)}</a></div>);
                if (onSuccess) {onSuccess()}
            } else {
                let signature: TransactionSignature = await sendTransaction(transaction, connection, { minContextSlot });
                const url = getExplorerUrl(signature, cluster);
                await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
                toast.success(<div><a href={url} target='_blank' rel='noreferrer'>Success! {shortenHash(signature)}</a></div>);
                if (onSuccess) {onSuccess()}
            }

        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
            console.log(error)
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection, sendTransaction, transactionInstructions, extraSigners, feePayer, onSuccess]);

    return (
        <div className={`${invisible ? 'w-full h-full': ''} flex items-center justify-center w-full h-full`}>
            <Toaster richColors />
            <button
                onClick={onClick}
                disabled={!publicKey || isLoading}
                className={invisible
                    ? `w-full h-full bg-transparent border-none focus:outline-none z-10 text-opacity-0 hover:text-opacity-40 text-white`
                    : `w-${width ?? 80} inline-flex items-center justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out transform active:scale-95 m-5 ${isLoading ? 'opacity-75' : ''}`
                }

            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <SpinnerIcon />
                    </div>
                ) : (
                    buttonLabel
                )}
            </button>

        </div>
    );

};

const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0H4z"></path>
    </svg>
);
