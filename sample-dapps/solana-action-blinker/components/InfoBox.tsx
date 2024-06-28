import React, { useState } from 'react';

const InfoBox: React.FC = () => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const examples = [
        'https://www.tensor.trade/trade/tensorians',
        'https://jup.ag/swap/USDC-SOL',
        `solana-action:${baseUrl}/api/actions/memo`,
        `solana-action:${baseUrl}/api/actions/donate`,
    ];

    const docLinks = [
        {
            url: "https://www.quicknode.com/guides/solana-development/solana-pay/actions-and-blinks/",
            text: "What are Solana Actions and Blockchain Links (Blinks)?"
        },
        {
            url: "https://solana.com/docs/advanced/actions",
            text: "Solana Actions Documentation"
        }
    ];

    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const getDisplayText = (url: string) => {
        if (url.startsWith(`solana-action:${baseUrl}/`)) {
            return 'solana-action:/' + url.split(`${baseUrl}/`)[1];
        }
        return url;
    };

    return (
        <div className="bg-gray-100 p-4 rounded-md mt-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Try one of these example URLs:</h2>
            <ul className="space-y-2">
                {examples.map((example, index) => (
                    <li key={index} className="w-full overflow-hidden">
                        <button
                            onClick={() => copyToClipboard(example, index)}
                            className="text-blue-500 hover:text-blue-700 text-sm flex items-center w-full"
                        >
                            <span className="truncate flex-grow text-left" title={example}>
                                {getDisplayText(example)}
                            </span>
                            {copiedIndex === index && (
                                <span className="ml-2 text-green-500 text-xs flex-shrink-0">Copied!</span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Learn more about Solana Actions:</h2>
                <ul className="space-y-2">
                    {docLinks.map((link, index) => (
                        <li key={index}>
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                            >
                                {link.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default InfoBox;