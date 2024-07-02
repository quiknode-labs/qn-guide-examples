import { useState } from "react";
import Spinner from "../Spinner";
import { ActionRuleObject } from "@solana/actions";

interface ActionUrlSearchFormProps {
    onSubmit: (url: string) => void;
    loading: boolean
}

const ActionUrlSearchForm: React.FC<ActionUrlSearchFormProps> = ({ onSubmit, loading }) => {
    const [url, setUrl] = useState<string>('');
    const [formError, setFormError] = useState<string | null>(null);

    const fetchActionsJson = async (baseUrl: string): Promise<ActionRuleObject[] | null> => {
        try {
            const response = await fetch(`${baseUrl}/actions.json`);
            if (response.ok) {
                const data = await response.json();
                return data.rules;
            }
        } catch (error) {
            console.error("Error fetching actions.json:", error);
        }
        return null;
    };

    const matchUrlToRule = (url: string, rules: ActionRuleObject[]): string | null => {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;
    
        for (const rule of rules) {
            // Special handling for root path
            if (rule.pathPattern === '/**' && (pathname === '/' || pathname === '')) {
                return rule.apiPath;
            }
    
            const pattern = new RegExp('^' + rule.pathPattern.replace(/\*\*/g, '(.*)').replace(/\*/g, '([^/]*)') + '$');
            const match = pathname.match(pattern);
    
            if (match) {
                let apiPath = rule.apiPath;
    
                // If apiPath is an absolute URL and doesn't contain wildcards, return it as is
                if (apiPath.startsWith('http') && !apiPath.includes('*')) {
                    return apiPath;
                }
    
                // Handle ** wildcard
                if (apiPath.includes('**')) {
                    const wildcardPart = match[1] || '';
                    apiPath = apiPath.replace('**', wildcardPart);
                }
                // Handle * wildcards
                else if (apiPath.includes('*')) {
                    const pathSegments = pathname.split('/').filter(Boolean);
                    const apiPathSegments = apiPath.split('/');
                    apiPathSegments.forEach((segment, index) => {
                        if (segment === '*') {
                            apiPath = apiPath.replace(segment, pathSegments[index] || '');
                        }
                    });
                }
    
                // Preserve query parameters
                if (parsedUrl.search) {
                    apiPath += parsedUrl.search;
                }
    
                return apiPath;
            }
        }
        return null;
    };

    const isValidActionUrl = async (inputUrl: string): Promise<string | null> => {
        // Case 1: Explicit Action URL
        if (inputUrl.startsWith('solana-action:')) {
            const actionUrl = inputUrl.replace('solana-action:', '');
            if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
                return actionUrl;
            }
        }

        // Case 2: Website URL (potentially linked to actions.json)
        if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
            const parsedUrl = new URL(inputUrl);
            const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
            const rules = await fetchActionsJson(baseUrl);
            if (rules) {
                const mappedUrl = matchUrlToRule(inputUrl, rules);
                if (mappedUrl) {
                    // For relative URLs, prepend the baseUrl
                    return mappedUrl.startsWith('http') ? mappedUrl : `${baseUrl}${mappedUrl}`;
                }
            }
        }

        // Case 3: Embedded Action URL in interstitial site URL
        const interstitialUrlRegex = /^https?:\/\/.*\?action=.*/;
        if (interstitialUrlRegex.test(inputUrl)) {
            const params = new URLSearchParams(inputUrl.split('?')[1]);
            const actionParam = params.get('action');
            if (actionParam && actionParam.startsWith('solana-action:')) {
                return actionParam.replace('solana-action:', '');
            }
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        try {
            const validUrl = await isValidActionUrl(url);
            if (!validUrl) {
                setFormError('Invalid Solana Action URL');
                return;
            }
            setUrl(validUrl);
            onSubmit(validUrl);
        } catch (error) {
            setFormError('Error validating URL');
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter Solana Action URL"
                className="w-full p-2 border border-gray-300 rounded"
            />
            <button
                type="submit"
                className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                disabled={loading}
            >
                {loading ? <Spinner /> : "Parse Action"}
            </button>
            {formError && <div className="text-red-500">{formError}</div>}
        </form>
    );
};

export default ActionUrlSearchForm;