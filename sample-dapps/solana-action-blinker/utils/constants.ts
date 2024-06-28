import { Cluster, LAMPORTS_PER_SOL } from "@solana/web3.js";

type ClusterWithLocal = Cluster | 'local';

export const ACTIVE_CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || 'local') as ClusterWithLocal;
export const MINIMUM_BALANCE = 0.05 * LAMPORTS_PER_SOL;