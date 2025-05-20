import { useState, useEffect } from "react";
import { fetchWalletHistory } from "../lib/api";

export function useWalletHistory(address: string | undefined) {
  const [walletData, setWalletData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadWalletData() {
      if (!address) {
        setWalletData(null);
        return;
      }

      try {
        setIsLoading(true);
        const data = await fetchWalletHistory(address);
        setWalletData(data.result);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load wallet data")
        );
        console.error("Error fetching wallet history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWalletData();
  }, [address]);

  return { walletData, isLoading, error };
}