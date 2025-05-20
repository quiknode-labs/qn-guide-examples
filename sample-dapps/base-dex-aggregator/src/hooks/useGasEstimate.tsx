import { useState, useCallback } from "react";
import { fetchGasEstimates } from "../lib/api";

export function useGasEstimate() {
  const [gasEstimates, setGasEstimates] = useState(null);
  const [isLoadingGas, setIsLoadingGas] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch gas estimates on demand
  const fetchGasEstimatesNow = useCallback(async () => {
    try {
      setIsLoadingGas(true);
      const estimates = await fetchGasEstimates();
      setGasEstimates(estimates);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load gas estimates")
      );
      console.error("Error fetching gas estimates:", err);
    } finally {
      setIsLoadingGas(false);
    }
  }, []);

  return { gasEstimates, isLoadingGas, error, fetchGasEstimatesNow };
}
