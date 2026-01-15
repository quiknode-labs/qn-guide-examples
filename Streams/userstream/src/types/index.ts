export interface User {
    id: string;
    name: string;
    walletAddress: string;
    chainType: 'EVM' | 'SOL';
    displayName: string | null;  // ENS, SNS, or custom tag
    createdAt: Date;
}

export interface ActivityLog {
    id: number;
    userId: string;
    txHash: string;
    activityType: string;
    details: string;
    chain: string;
    direction: 'in' | 'out';
    timestamp: Date;
    user?: User;
}

export interface Token {
    id: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    chain: string;
}

export type ChainType = 'EVM' | 'SOL';
