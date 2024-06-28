import { useState } from 'react';
import { ActionGetResponse, ActionPostResponse } from '@solana/actions';

interface ActionFetchState {
  getResults: ActionGetResponse | null;
  postResults: ActionPostResponse | null;
  error: string | null;
  isLoading: boolean;
}

const useActionFetch = () => {
  const [state, setState] = useState<ActionFetchState>({
    getResults: null,
    postResults: null,
    error: null,
    isLoading: false,
  });

  const fetchActionGet = async (url: string) => {
    setState(prev => ({ ...prev, error: null, getResults: null, isLoading: true }));
    try {
      const actionUrl = url.replace('solana-action:', '');
      const response = await fetch(actionUrl);
      const data = await response.json() as ActionGetResponse;
      setState(prev => ({ ...prev, getResults: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch or parse the Action GET data',
        isLoading: false,
      }));
      console.error(err);
    }
  };

  const fetchActionPost = async (url: string, account: string) => {
    setState(prev => ({ ...prev, error: null, postResults: null, isLoading: true }));
    try {
      const actionUrl = url.replace('solana-action:', '');
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account }),
      });
      const data = await response.json() as ActionPostResponse;
      setState(prev => ({ ...prev, postResults: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch or parse the Action POST data',
        isLoading: false,
      }));
      console.error(err);
    }
  };

  return {
    getResults: state.getResults,
    postResults: state.postResults,
    error: state.error,
    isLoading: state.isLoading,
    fetchActionGet,
    fetchActionPost,
  };
};

export default useActionFetch;