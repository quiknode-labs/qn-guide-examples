import React from "react";
import { LinkedAction } from "@solana/actions";
import ActionForm from "./ActionForm";

interface ActionButtonsProps {
    links?: { actions: LinkedAction[] };
    label: string;
    disabled?: boolean;
    onSubmit: (url?: string) => void;
    actionUrl: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ links, label, disabled, onSubmit, actionUrl }) => {
    const getBaseUrl = (url: string) => {
        const parsedUrl = new URL(url);
        return `${parsedUrl.protocol}//${parsedUrl.host}`;
    };
    const baseUrl = getBaseUrl(actionUrl);

    if (links?.actions) {
        return (
            <div>
                <strong>Linked Actions:</strong>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 w-full">
                    {links.actions.map((action, index) => (
                        <ActionForm
                            key={index}
                            action={action}
                            onSubmit={onSubmit}
                            baseUrl={baseUrl}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => onSubmit()}
            disabled={disabled}
            className={`w-full px-4 py-2 bg-blue-500 text-white rounded ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
        >
            {label}
        </button>
    );
};

export default ActionButtons