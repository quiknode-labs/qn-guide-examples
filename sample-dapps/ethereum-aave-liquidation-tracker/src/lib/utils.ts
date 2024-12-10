import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(value: number, decimals = 2): string {
  if (Math.abs(value) < 0.0001) {
    return value.toExponential(4);
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatMetricNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Helper function to format currency
export function formatUSD(num: number): string {
  if (num === 0) return "$0";
  
  if (Math.abs(num) < 0.01) {
    return `$${num.toExponential(2)}`;
  }
  
  return `$${num.toFixed(2)}`;
};

export function formatWeiAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount) / Math.pow(10, decimals);
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 2,
  });
};

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

// Helper function to open Etherscan links
export function openEtherscan(type: "tx" | "address" | "block", value: string | number) {
  const baseUrl = "https://etherscan.io";
  const urls = {
    tx: `${baseUrl}/tx/${value}`,
    address: `${baseUrl}/address/${value}`,
    block: `${baseUrl}/block/${value}`,
  };
  window.open(urls[type], "_blank");
}