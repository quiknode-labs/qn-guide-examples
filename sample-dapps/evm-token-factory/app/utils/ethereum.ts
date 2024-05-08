export interface ChainConfig {
    factoryAddress: string;
    explorerUrl: string;
}

export interface RequestBody {
    chainId: number;
    signerAddress: string;
    tokenName: string;
    tokenSymbol: string;
    tokenAmount: string;
}

export const CHAINS: Record<number, ChainConfig> = {
    1: { // Ethereum Mainnet
        factoryAddress: "0x", // Needs to be deployed
        explorerUrl: "https://etherscan.io", 
    },
    17000: { // Holesky
        factoryAddress: "0x5fCCa8dCeD28B13f2924CB78B934Ab0AF445542A",
        explorerUrl: "https://holesky.etherscan.io", 
    },
    11155111: { // Sepolia
        factoryAddress: "0x28D99a0A1B430B3669B8A2799dCDd7d332ceDb1C",
        explorerUrl: "https://sepolia.etherscan.io", 
    }
};

export function handleError(error: unknown): Response {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: message }), {
        headers: { 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message === 'Wallet address is required.' ? 400 : 500,
    });
}