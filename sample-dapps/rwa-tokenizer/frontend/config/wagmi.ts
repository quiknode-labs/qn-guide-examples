import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { supportedChains } from './chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'RWA Tokenizer',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: supportedChains,
  ssr: true,
})
