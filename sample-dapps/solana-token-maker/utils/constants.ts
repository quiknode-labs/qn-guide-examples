import { Cluster } from "@solana/web3.js";

type ClusterWithLocal = Cluster | 'local';

export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://quicknode.quicknode-ipfs.com/ipfs/';
export const ACTIVE_CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || 'mainnet-beta') as ClusterWithLocal;
