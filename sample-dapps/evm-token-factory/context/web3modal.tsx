'use client'

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. Get projectId using environment variable
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

// 2. Set chains using environment variables
export const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL as string
}

export const holesky = {
  chainId: 17000,
  name: 'Ethereum Holesky',
  currency: 'ETH',
  explorerUrl: 'https://holesky.etherscan.io',
  rpcUrl: process.env.NEXT_PUBLIC_HOLESKY_RPC_URL as string
}

export const sepolia = {
  chainId: 11155111,
  name: 'Ethereum Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL as string
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

const validateConstants = (chains: any[], projectId: string) => {
  const invalidChains = chains.filter(chain => !chain.rpcUrl || chain.rpcUrl.includes('RPC_URL'));
  if (invalidChains.length > 0) {
    throw new Error(`Update src/context/web3modal.tsx. Missing RPC URLs for the following chains: ${invalidChains.map(chain => chain.name).join(', ')}.`);
  }
  if (!projectId || !projectId.match(/^[a-f0-9]{32}$/i)) {
    throw new Error(`Update src/context/web3modal.tsx. Invalid or missing projectId: '${projectId}'. It should be a 32-character hexadecimal string.`);
  }
}

validateConstants([sepolia, mainnet, holesky], projectId);

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