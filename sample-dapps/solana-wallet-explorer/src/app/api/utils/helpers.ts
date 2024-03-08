import { Connection, PublicKey } from '@solana/web3.js';

export async function parseAndValidateAddress(walletAddress: string | null): Promise<PublicKey> {
  if (!walletAddress) {
    throw new Error('Wallet address is required.');
  }
  try {
    return new PublicKey(walletAddress);
  } catch {
    throw new Error('Invalid wallet address.');
  }
}


export function initializeConnection(): Connection {
  if (!process.env.SOLANA_RPC_URL) {
    throw new Error('SOLANA_RPC_URL is not set');
  }
  return new Connection(process.env.SOLANA_RPC_URL);
}

export function getDasEndpoint(): string {
  const dasApiEnabled = process.env.DAS_API_ENABLED === 'true';
  if (!dasApiEnabled) {
    throw new Error('DAS API is not enabled');
  }
  if (!process.env.SOLANA_RPC_URL) {
    throw new Error('SOLANA_RPC_URL is not set');
  }
  return process.env.SOLANA_RPC_URL;
}

export function handleError(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return new Response(JSON.stringify({ error: message }), {
    headers: { 'Content-Type': 'application/json' },
    status: error instanceof Error && error.message === 'Wallet address is required.' ? 400 : 500,
  });
}

