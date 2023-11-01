import React, { FC, useCallback, useState } from 'react';
import { Transaction, TransactionInstruction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import type { TransactionSignature } from '@solana/web3.js';
import { getExplorerUrl, shortenHash } from '@/utils/utils';
import { Toaster, toast } from 'sonner';
import { cluster } from '@/utils/constants';

type SendTransactionTemplateProps = {
    transactionInstructions: TransactionInstruction[];
    buttonLabel: string;
};

export const SendTransactionTemplate: FC<SendTransactionTemplateProps> = ({ transactionInstructions, buttonLabel }) => {
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
            transaction.feePayer = publicKey;

            let signature: TransactionSignature = await sendTransaction(transaction, connection, { minContextSlot });
            const url = getExplorerUrl(signature, cluster);
            await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
            toast.success(<div><a href={url} target='_blank' rel='noreferrer'>Success! {shortenHash(signature)}</a></div>);
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }

    }, [publicKey, connection, sendTransaction, transactionInstructions]);

    return (
        <div>
            <Toaster richColors />
            <button
                onClick={onClick}
                disabled={!publicKey || isLoading}
                className={`w-80 inline-flex items-center justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out transform active:scale-95 m-5 ${isLoading ? 'opacity-75' : ''}`}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center"> {/* Additional div to center the spinner */}
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
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0H4z"></path>
    </svg>
);