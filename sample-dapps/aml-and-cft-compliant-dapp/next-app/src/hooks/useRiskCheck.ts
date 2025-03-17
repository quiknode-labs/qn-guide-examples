"use client";

import { useState } from "react";

export function useRiskCheck() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

interface RiskCheckResult {
  riskScore: bigint | null;
  errorCode?: string; // Optional error code (e.g., "INVALID_ADDRESS")
  errorMessage?: string; // Optional error message (e.g., "Invalid wallet address: not found on blockchain")
}

const checkRiskScore = async (address: string): Promise<RiskCheckResult> => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch("/api/check-risk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userAddress: address }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return {
        riskScore: null,
        errorCode: data.errorCode || "UNKNOWN_ERROR",
        errorMessage: data.error || "Failed to check risk score",
      };
    }

    return {
      riskScore: data.riskScore ? BigInt(data.riskScore) : null,
      errorCode: undefined,
      errorMessage: undefined,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    setError(errorMessage);
    console.error("Risk check error:", err);
    return {
      riskScore: null,
      errorCode: "FETCH_ERROR",
      errorMessage: errorMessage,
    };
  } finally {
    setIsLoading(false);
  }
};

  return {
    checkRiskScore,
    isLoading,
    error,
  };
}
