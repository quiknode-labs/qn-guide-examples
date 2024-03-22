"use client"
import React, { useEffect, useState } from 'react';

export interface BalanceProps {
  walletAddress: string;
}

const Balance = ({ walletAddress }: BalanceProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    const fetchBalance = async () => {
      try {
        const response = await fetch(`/api/wallet/balance?walletAddress=${walletAddress}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setBalance(data.ethBalance);
      } catch (error) {
        setError('Failed to fetch balance');
        console.error("Error fetching balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [walletAddress]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="text-4xl font-bold">
      {Number(balance).toFixed(2)} ETH
    </div>
  );
};

export default Balance;
