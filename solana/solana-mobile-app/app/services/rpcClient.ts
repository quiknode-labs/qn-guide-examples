import { createSolanaRpc } from '@solana/kit';
import { SOLANA_RPC_URL } from '../constants';

// Create a single RPC instance that can be reused across all services
export const rpc = createSolanaRpc(SOLANA_RPC_URL);

// Export the type for use in service functions
export type RpcClient = typeof rpc;

