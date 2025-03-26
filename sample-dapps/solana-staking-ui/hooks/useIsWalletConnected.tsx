"use client";
import { useContext } from "react";
import { useWallets } from "@wallet-standard/react";
import { SelectedWalletAccountContext } from "../context/SelectedWalletAccountContext";

export function useIsWalletConnected(): boolean {
  const wallets = useWallets();
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);

  // If no selected wallet account exists, we're not connected
  if (!selectedWalletAccount) {
    return false;
  }

  // Check if the selected wallet account exists in any wallet's accounts array
  const isConnected = wallets.some((wallet) =>
    wallet.accounts.some(
      (account) => account.address === selectedWalletAccount.address
    )
  );

  return isConnected;
}
