"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

const network = WalletAdapterNetwork.Mainnet;
const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [rpcUrl, setRpcUrl] = useState<string>(DEFAULT_RPC_URL);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch RPC URL from API route
    fetch("/api/rpc-endpoint")
      .then((res) => res.json())
      .then((data) => {
        if (data.rpcUrl) {
          setRpcUrl(data.rpcUrl);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch RPC endpoint:", error);
        // Keep default RPC URL on error
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  // Show loading state or render with default RPC URL
  // ConnectionProvider will work with the default URL until the real one loads
  return (
    <ConnectionProvider endpoint={rpcUrl}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

