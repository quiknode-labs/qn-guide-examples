import { address } from '@solana/kit';
import type { RpcClient } from './rpcClient';

export const fetchSolBalance = async (
  addressString: string,
  rpc: RpcClient
): Promise<number> => {
  try {
    console.log('Fetching balance for address:', addressString);
    
    // Convert string address to address type
    const solanaAddress = address(addressString);
    
    // Get balance using the proper @solana/kit API
    const { value: balanceLamports } = await rpc.getBalance(solanaAddress).send();
    
    console.log('Balance in lamports:', balanceLamports);
    
    return Number(balanceLamports);
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      address: addressString
    });
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection refused')) {
      throw new Error('Cannot connect to local validator. Make sure solana-test-validator is running on port 8899.');
    } else if (errorMessage.includes('timeout')) {
      throw new Error('Connection timeout. Check if local validator is running.');
    } else {
      throw new Error(`Failed to fetch balance: ${errorMessage}`);
    }
  }
};
