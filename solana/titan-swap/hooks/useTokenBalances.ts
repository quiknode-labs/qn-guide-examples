"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { SOL_MINT } from "@/lib/tokens";
import type { TokenBalance } from "@/lib/types";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

/** Token balances read straight from QuickNode RPC (no aggregator needed). */
export function useTokenBalances() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [lamports, std, t22] = await Promise.all([
        connection.getBalance(publicKey),
        connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ]);

      const result: TokenBalance[] = [];
      if (lamports > 0) {
        result.push({ mint: SOL_MINT, balance: lamports, decimals: 9 });
      }

      for (const { account } of [...std.value, ...t22.value]) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const info = (account.data as any).parsed?.info;
        const amount = Number(info?.tokenAmount?.amount ?? 0);
        if (amount > 0) {
          result.push({
            mint: info.mint,
            balance: amount,
            decimals: info.tokenAmount.decimals ?? 0,
          });
        }
      }

      setBalances(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  const getBalance = (mint: string): number => {
    const b = balances.find((x) => x.mint === mint);
    return b ? b.balance / Math.pow(10, b.decimals) : 0;
  };

  return { balances, loading, error, refreshBalances, getBalance };
}
