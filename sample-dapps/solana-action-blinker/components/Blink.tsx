import React, { useState } from 'react';
import ParsedAction from './ActionComponents/ParsedAction';
import ActionUrlSearchForm from './ActionComponents/ActionUrlSearchForm';
import ErrorMessage from './ErrorMessage';
import Container from './Container';
import useActionFetch from '@/hooks/useActionFetch';
import Spinner from './Spinner';
import InfoBox from './InfoBox';

const Blink: React.FC = () => {
    const { getResults, error, isLoading, fetchActionGet } = useActionFetch();
    const [showParsedAction, setShowParsedAction] = useState(false);
    const [actionUrl, setActionUrl] = useState<string>('');

    const handleActionFetch = async (url: string) => {
        setActionUrl(url);
        await fetchActionGet(url);
        setShowParsedAction(true);
    };

    if (showParsedAction && getResults) {
        return (
            <Container>
                <ParsedAction results={getResults} actionUrl={actionUrl} />
                <button
                    className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    onClick={() => setShowParsedAction(false)}
                >
                    ⬅ Back
                </button>
            </Container>
        );
    }

    return (
        <Container>
            <h1 className="text-2xl font-bold text-black mb-4">Parse a Solana Action by URL</h1>
            <ActionUrlSearchForm onSubmit={handleActionFetch} loading={isLoading} />
            {isLoading && <Spinner />}
            {error && <ErrorMessage message={error} />}
            <InfoBox />
        </Container>
    );
};

export default Blink;