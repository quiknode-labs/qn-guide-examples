import React, { useEffect } from "react";
import { ActionGetResponse } from "@solana/actions";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import useActionFetch from "@/hooks/useActionFetch";
import useTransactionProcessor from "@/hooks/useTransactionProcessor";
import ActionButtons from "./ActionButtons";
import ActionDetails from "./ActionDetails";
import ErrorMessage from "../ErrorMessage";

interface ParsedActionProps {
    results: ActionGetResponse;
    actionUrl: string;
}

const ParsedAction: React.FC<ParsedActionProps> = ({ results, actionUrl }) => {
    const { connected, publicKey } = useWallet();
    const { icon, title, description, label, disabled, links, error } = results;
    const { fetchActionPost, postResults, isLoading } = useActionFetch();
    const { transactionError, transactionUrl } = useTransactionProcessor(postResults);
    const handleActionSubmit = async (url?: string) => {
        if (!publicKey || !connected) {
            toast.error("Wallet not connected");
            return;
        }
        await fetchActionPost(url ?? actionUrl, publicKey.toBase58());
    };

    useEffect(() => {
        if (transactionUrl) {
            toast.success(
                <div>
                    Success!&nbsp;
                    <a href={transactionUrl} target='_blank' rel='noreferrer'>
                        (View Transaction ↗️)
                    </a>
                </div>
            );
        }
    }, [transactionUrl]);

    return (
        <div className="space-y-2">
            <h2 className="text-xl font-semibold">Parsed Action:</h2>
            <div className="text-slate-500 text-sm italic">{actionUrl}</div>

            <ActionDetails
                icon={icon}
                title={title}
                description={description}
                label={label}
                disabled={disabled}
            />

            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                <p className="font-bold">Warning</p>
                <p>These actions have not been vetted and could potentially be malicious. Use at your own risk. Always verify the source and content of actions before proceeding.</p>
            </div>

            {connected ? (
                <ActionButtons
                    links={links}
                    label={label}
                    disabled={disabled || isLoading}
                    onSubmit={handleActionSubmit}
                    actionUrl={actionUrl}
                />
            ) : (
                <div className="text-center text-gray-500">
                    Please connect your wallet to view available actions.
                </div>
            )}

            {error && <ErrorMessage message={error.message} />}
            {transactionError && <ErrorMessage message={transactionError} />}
        </div>
    );
};

export default ParsedAction;