"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { authenticateWithSIWE } from "@/lib/x402";

type UseX402AuthResult = {
  jwt: string | null;
  accountId: string | null;
  expiresAt: Date | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  authenticate: () => Promise<void>;
  clearSession: () => void;
};

export function useX402Auth(): UseX402AuthResult {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [jwt, setJwt] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setJwt(null);
    setAccountId(null);
    setExpiresAt(null);
    setAuthError(null);
  }, []);

  const isAuthenticated = useMemo(() => {
    if (!jwt || !expiresAt) {
      return false;
    }

    return expiresAt.getTime() > Date.now();
  }, [expiresAt, jwt]);

  const authenticate = useCallback(async () => {
    if (!walletClient) {
      throw new Error("Connect a wallet before authentication.");
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const response = await authenticateWithSIWE(walletClient);
      setJwt(response.token);
      setAccountId(response.accountId);
      setExpiresAt(new Date(response.expiresAt));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      setAuthError(message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [walletClient]);

  useEffect(() => {
    if (!isConnected) {
      clearSession();
    }
  }, [clearSession, isConnected]);

  // Clear session when the wallet address changes (e.g. switching accounts)
  useEffect(() => {
    clearSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const msUntilExpiry = expiresAt.getTime() - Date.now();
    if (msUntilExpiry <= 0) {
      clearSession();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearSession();
    }, msUntilExpiry);

    return () => window.clearTimeout(timeoutId);
  }, [clearSession, expiresAt]);

  return {
    jwt,
    accountId,
    expiresAt,
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
    clearSession,
  };
}
