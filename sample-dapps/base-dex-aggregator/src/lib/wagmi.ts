
import { base } from "wagmi/chains";
import { createConfig, http } from "wagmi";
import { QUICKNODE_ENDPOINT_URL, WALLETCONNECT_PROJECT_ID } from "./constants";
import { getDefaultConfig } from "connectkit";


export const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [base],
    transports: {
      // RPC URL for each chain
      [base.id]: http(QUICKNODE_ENDPOINT_URL),
    },

    // Required API Keys
    walletConnectProjectId: WALLETCONNECT_PROJECT_ID,

    // Required App Info
    appName: "Base DEX Aggregator",
  })
);