import { useState, useEffect } from 'react';
import { fetchSolBalance } from '../services/solanaService';
import { rpc } from '../services/rpcClient';

export const useSolBalance = (address: string | null) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = async () => {
    if (!address) {
      setBalance(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const balanceSol = await fetchSolBalance(address, rpc);
      setBalance(balanceSol);
    } catch (err) {
      console.error('Error in useSolBalance:', err);
      setError('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [address]);

  return { balance, loading, error, refreshBalance: loadBalance };
};
