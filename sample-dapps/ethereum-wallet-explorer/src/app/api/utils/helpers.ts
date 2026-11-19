import { ethers } from 'ethers';

// Validates Ethereum addresses using ethers.js
export async function parseAndValidateAddress(walletAddress: string | null): Promise<string> {
  if (!walletAddress) {
    throw new Error('Wallet address is required.');
  }
  if (ethers.isAddress(walletAddress)) {
    return walletAddress;
  } else {
    throw new Error('Invalid wallet address.');
  }
}

// Initializes a connection to an Ethereum provider
export function initializeConnection(): ethers.JsonRpcProvider {
  const endpoint = getEthRpcUrl();
  const token = process.env.ETHEREUM_RPC_TOKEN;
  if (!token) return new ethers.JsonRpcProvider(endpoint);

  const request = new ethers.FetchRequest(endpoint);
  request.setHeader('x-token', token);
  return new ethers.JsonRpcProvider(request);
}

// Example of getting the Ethereum RPC URL
export function getEthRpcUrl(): string {
  const ethRpcUrl = process.env.ETHEREUM_RPC_URL || process.env.ETH_RPC_URL;
  if (!ethRpcUrl) {
    throw new Error('ETHEREUM_RPC_URL is not set');
  }
  return ethRpcUrl;
}

// Error handling remains the same
export function handleError(error: unknown): Response {
  const message = error instanceof Error && !("code" in error)
    ? error.message
    : 'Ethereum RPC request failed.';
  return new Response(JSON.stringify({ error: message }), {
    headers: { 'Content-Type': 'application/json' },
    status: error instanceof Error && error.message === 'Wallet address is required.' ? 400 : 500,
  });
}
