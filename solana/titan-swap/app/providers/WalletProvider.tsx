"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// Import each adapter from its own package, NOT the @solana/wallet-adapter-wallets
// barrel. The barrel re-exports ~40 adapters (Ledger, Torus, WalletConnect,
// Coinbase, …), and bundlers/dev compilers walk that entire graph even when you
// only use two — which balloons `next dev` compile time and memory.
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import "@solana/wallet-adapter-react-ui/styles.css";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  // Same-origin RPC proxy. The QuickNode endpoint/token lives only on the
  // server (QUICKNODE_RPC_URL); the browser talks to /api/rpc.
  const endpoint = useMemo(() => {
    if (typeof window !== "undefined") return `${window.location.origin}/api/rpc`;
    return "http://localhost/api/rpc"; // SSR placeholder; real calls happen client-side
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: "confirmed" }}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
