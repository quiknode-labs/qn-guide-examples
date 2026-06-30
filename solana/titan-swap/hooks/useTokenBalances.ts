"use client";

import { useState, useEffect, useCallback } from "react";
import { address } from "@solana/kit";
import { useWalletAccount } from "@/app/providers/WalletProvider";
import { createRpc } from "@/lib/rpc";
import { SOL_MINT } from "@/lib/tokens";
import type { TokenBalance } from "@/lib/types";

const TOKEN_PROGRAM_ID = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = address(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

/** Token balances read straight from Quicknode RPC via @solana/kit. */
export function useTokenBalances() {
  const { address: owner } = useWalletAccount();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = useCallback(async () => {
    if (!owner) {
      setBalances([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rpc = createRpc();
      const ownerAddress = address(owner);
      const [lamports, std, t22] = await Promise.all([
        rpc.getBalance(ownerAddress, { commitment: "confirmed" }).send(),
        rpc
          .getTokenAccountsByOwner(
            ownerAddress,
            { programId: TOKEN_PROGRAM_ID },
            { encoding: "jsonParsed", commitment: "confirmed" }
          )
          .send(),
        rpc
          .getTokenAccountsByOwner(
            ownerAddress,
            { programId: TOKEN_2022_PROGRAM_ID },
            { encoding: "jsonParsed", commitment: "confirmed" }
          )
          .send(),
      ]);

      const result: TokenBalance[] = [];
      const lamportsNum = Number(lamports.value);
      if (lamportsNum > 0) {
        result.push({ mint: SOL_MINT, balance: lamportsNum, decimals: 9 });
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
  }, [owner]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  const getBalance = (mint: string): number => {
    const b = balances.find((x) => x.mint === mint);
    return b ? b.balance / Math.pow(10, b.decimals) : 0;
  };

  return { balances, loading, error, refreshBalances, getBalance };
}
