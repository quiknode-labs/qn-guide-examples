import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Cluster, PublicKey, clusterApiUrl } from "@solana/web3.js";

export const cluster: Cluster = process.env.NEXT_PUBLIC_CLUSTER as Cluster || 'devnet';
export const endpoint: string = process.env.NEXT_PUBLIC_URL || clusterApiUrl(WalletAdapterNetwork.Devnet);
//export const endpoint: string = 'http://127.0.0.1:8899';
