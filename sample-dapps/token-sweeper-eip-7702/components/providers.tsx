"use client";
import "@rainbow-me/rainbowkit/styles.css";

import type React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { base, optimism } from "wagmi/chains";
import { http } from "wagmi";

// Create config and query client outside component to prevent re-initialization
const config = getDefaultConfig({
  // Your dApps chains
  chains: [base, optimism],
  transports: {
    [base.id]: http(
      process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"
    ),
    [optimism.id]: http(
      process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || "https://mainnet.optimism.io"
    ),
  },

  // Required API Keys
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",

  // Required App Info
  appName: "Token Sweeper",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" initialChain={base}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
