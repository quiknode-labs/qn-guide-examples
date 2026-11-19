import { Connection, PublicKey } from '@solana/web3.js';
import { ACTIVE_CLUSTER } from './constants';
import { ACTIONS_CORS_HEADERS } from '@solana/actions';

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
    let endpoint: string;
    if (!process.env.QN_ENDPOINT) {
        console.warn("NO process.env.QN_ENDPOINT Set. Using LocalHost.")
        endpoint = 'http://127.0.0.1:8899';
    } else {
        endpoint = process.env.QN_ENDPOINT;
    }
    const token = process.env.QN_ENDPOINT ? process.env.QN_ENDPOINT_TOKEN : undefined;
    const wsEndpoint = process.env.QN_WS_ENDPOINT;
    if (token && !wsEndpoint) {
        throw new Error('QN_WS_ENDPOINT is required when setting QN_ENDPOINT_TOKEN.');
    }
    return new Connection(endpoint, {
        httpHeaders: token ? { 'x-token': token } : undefined,
        wsEndpoint,
    });
}

export function handleError(error: unknown): Response {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: message }), {
        headers: ACTIONS_CORS_HEADERS,
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

