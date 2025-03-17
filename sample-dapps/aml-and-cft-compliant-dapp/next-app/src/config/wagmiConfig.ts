"use client";

import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

export const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [base],
    transports: {
      // RPC URL for each chain
      [base.id]: http(process.env.QUICKNODE_ENDPOINT || ""),
    },

    // Required API Keys
    walletConnectProjectId:
      process.env.WALLETCONNECT_PROJECT_ID || "",

    // Required App Info
    appName: "Compliant DeFi App",
  })
);
