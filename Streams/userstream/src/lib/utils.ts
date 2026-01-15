import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isAddress } from 'viem'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function detectChainType(address: string): 'EVM' | 'SOL' | null {
  // EVM: Use viem's isAddress for robust validation
  if (isAddress(address)) {
    return 'EVM';
  }
  // Solana: Base58, 32-44 chars, no 0/O/I/l
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return 'SOL';
  }
  return null;
}

export function normalizeAddress(address: string, chainType: 'EVM' | 'SOL'): string {
  return chainType === 'EVM' ? address.toLowerCase() : address;
}

export function truncateAddress(address: string, chars = 4): string {
  const prefix = address.startsWith('0x') ? 2 : 0;
  return `${address.slice(0, chars + prefix)}...${address.slice(-chars)}`;
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function getExplorerTxUrl(chain: string, txHash: string): string {
  if (chain.startsWith('solana')) {
    return `https://solscan.io/tx/${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`;
}

export function getExplorerBlockUrl(chain: string, blockRef: string | number): string {
  if (chain.startsWith('solana')) {
    return `https://solscan.io/block/${blockRef}`;
  }
  return `https://etherscan.io/block/${blockRef}`;
}

// Parse bulk addresses (comma, newline, or space separated)
export function parseBulkAddresses(input: string): string[] {
  return input
    .split(/[,\n\s]+/)
    .map(addr => addr.trim())
    .filter(addr => addr.length > 0);
}
