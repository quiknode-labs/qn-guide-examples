import { Connection, PublicKey } from '@solana/web3.js';
import { ACTIVE_CLUSTER } from './constants';

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


export function getExplorerUrl(txId: string): string {
    let suffix = '';
    if (ACTIVE_CLUSTER === 'local') {
        suffix = '?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899';
    } else {
        suffix = `?cluster=${ACTIVE_CLUSTER}`;
    }
    return `https://explorer.solana.com/tx/${txId}${suffix}`;
}