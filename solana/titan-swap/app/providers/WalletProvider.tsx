"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  SelectedWalletAccountContextProvider,
  useSelectedWalletAccount,
  useWalletAccountTransactionSigner,
} from "@solana/react";
import type { UiWallet, UiWalletAccount } from "@wallet-standard/react";
import type { TransactionSigner } from "@solana/kit";

/** The cluster this app operates on. Titan routes execute on Solana mainnet. */
export const SOLANA_CHAIN = "solana:mainnet" as const;

const STORAGE_KEY = "titan-swap:selected-wallet";

// Only surface wallets that can operate on a Solana cluster.
function filterWallets(wallet: UiWallet): boolean {
  return wallet.chains.some((chain) => chain.startsWith("solana:"));
}

// Persist the selected wallet/account so it is restored on the next visit —
// the @solana/react equivalent of wallet-adapter's `autoConnect`.
const stateSync = {
  getSelectedWallet: () =>
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(STORAGE_KEY),
  storeSelectedWallet: (key: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, key);
  },
  deleteSelectedWallet: () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  },
};

// ---------------------------------------------------------------------------
// Signer context
//
// `useWalletAccountTransactionSigner` is a hook and needs a non-null account,
// so it can't be called conditionally inside useSwap. Instead a bridge mounts
// it only while an account is selected and publishes the Kit signer here, where
// any component (e.g. useSwap) can read it.
// ---------------------------------------------------------------------------

type Signer = TransactionSigner | null;
const TxSignerContext = createContext<Signer>(null);

/** The Kit transaction signer for the connected wallet, or null. */
export function useTxSigner(): Signer {
  return useContext(TxSignerContext);
}

/** Selected account + the filtered Solana wallet list, plus the convenience
 *  `address` string (base58) and the `wallet` that owns the selected account
 *  (for connect/disconnect, so consumers don't re-search the list). */
export function useWalletAccount(): {
  account: UiWalletAccount | undefined;
  setAccount: (account: UiWalletAccount | undefined) => void;
  wallets: readonly UiWallet[];
  wallet: UiWallet | undefined;
  address: string | null;
} {
  const [account, setAccount, wallets] = useSelectedWalletAccount();
  const wallet = account
    ? wallets.find((w) => w.accounts.some((a) => a.address === account.address))
    : undefined;
  return {
    account,
    setAccount,
    wallets,
    wallet,
    address: account?.address ?? null,
  };
}

function ActiveSigner({
  account,
  onSigner,
}: {
  account: UiWalletAccount;
  onSigner: (signer: Signer) => void;
}) {
  const signer = useWalletAccountTransactionSigner(account, SOLANA_CHAIN);
  useEffect(() => {
    // @solana/react ships its own @solana/signers major (6.x) which is
    // structurally identical to the one bundled in @solana/kit (2.x) but a
    // distinct TS type. The runtime object is a valid Kit signer, so we bridge
    // the version skew with a single cast here.
    onSigner(signer as unknown as TransactionSigner);
    return () => onSigner(null);
  }, [signer, onSigner]);
  return null;
}

function SignerBridge({ onSigner }: { onSigner: (signer: Signer) => void }) {
  const [account] = useSelectedWalletAccount();
  return account ? <ActiveSigner account={account} onSigner={onSigner} /> : null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [signer, setSigner] = useState<Signer>(null);

  return (
    <SelectedWalletAccountContextProvider
      filterWallets={filterWallets}
      stateSync={stateSync}
    >
      <TxSignerContext.Provider value={signer}>
        <SignerBridge onSigner={setSigner} />
        {children}
      </TxSignerContext.Provider>
    </SelectedWalletAccountContextProvider>
  );
}
