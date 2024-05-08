'use client'

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'

// 2. Set chains
export const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'MAINNET_RPC_URL'
}

export const holesky = {
  chainId: 17000,
  name: 'Ethereum Holesky',
  currency: 'ETH',
  explorerUrl: 'https://holesky.etherscan.io',
  rpcUrl: 'HOLESKY_RPC_URL'
}

export const sepolia = {
  chainId: 11155111,
  name: 'Ethereum Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'SEPOLIA_RPC_URL'
}

// 3. Create a metadata object
const metadata = {
  name: 'EVM Token Factory',
  description: 'An EVM ERC-20 Token Factory',
  url: 'https://mywebsite.com', // origin must match your domain & subdomain
  icons: ['https://avatars.mywebsite.com/']
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,
  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
})

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [sepolia, mainnet, holesky],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true // Optional - false as default
})

export function Web3Modal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}