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

export function shortAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function initializeConnection(): Connection {
    if (!process.env.QN_ENDPOINT) {
        throw new Error('QN_ENDPOINT is not set');
    }
    return new Connection(process.env.QN_ENDPOINT);
}

export function handleError(error: unknown): Response {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: message }), {
        headers: { 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message === 'Wallet address is required.' ? 400 : 500,
    });
}

export function getExplorerUrl(txId: string, cluster?: string): string {
    const clusterText = cluster ? `?cluster=${cluster}` : '';
    return `https://explorer.solana.com/tx/${txId}${clusterText}`;
}

export async function fetchBlockhash() {
    try {
        const response = await fetch('/api/transactions/blockhash');
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        return { blockhash: data.blockhash, lastValidBlockHeight: data.lastValidBlockHeight }
    } catch (error) {
        console.error('Failed to fetch blockhash:', error);
    }
}

export function generateSolanaFmUrl(address?: string, tx?: string) {
    if (tx) return `https://solana.fm/tx/${tx}?cluster=localnet-solana`;
    if (address) return `https://solana.fm/address/${address}?cluster=localnet-solana`;
    return "";
}

