import { Cluster, LAMPORTS_PER_SOL } from "@solana/web3.js";

type ClusterWithLocal = Cluster | 'local';

export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://quicknode.quicknode-ipfs.com/ipfs/';
export const ACTIVE_CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || 'mainnet-beta') as ClusterWithLocal;
export const MINIMUM_BALANCE = 0.05 * LAMPORTS_PER_SOL;