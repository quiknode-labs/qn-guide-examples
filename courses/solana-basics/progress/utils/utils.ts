import { Cluster } from "@solana/web3.js";

export const getExplorerUrl = (signature: string, cluster: Cluster) => {
    return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
export const shortenHash = (str:string) => {
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

