import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia, baseSepoliaPreconf } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: 'Flashblocks Demo',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [baseSepolia],
  ssr: true,
})