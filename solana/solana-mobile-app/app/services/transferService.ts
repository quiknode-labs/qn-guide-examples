import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { fromByteArray } from 'base64-js';
import { APP_IDENTITY } from '../constants';
import { getStoredAuthToken } from './walletService';
import type { RpcClient } from './rpcClient';
import { sleep } from '../utils/sleep';

export const transferSol = async (
  fromAddress: string,
  toAddress: string,
  amountSol: number,
  rpc: RpcClient
): Promise<string> => {
  try {
    
    // Convert SOL amount to lamports
    const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
    
    // Use mobile wallet adapter to sign and send the transaction
    const signature = await transact(async (wallet: Web3MobileWallet) => {
      // Add a small delay to ensure the UI is ready
      await sleep(100);
      
      // Try to reuse existing session with stored auth token
      const storedAuthToken = await getStoredAuthToken();
      
      if (storedAuthToken) {
        try {
          // Try silent reauthorization with stored token
          await wallet.reauthorize({
            auth_token: storedAuthToken,
            identity: APP_IDENTITY,
          });
        } catch (reauthError) {
          console.log('Silent reauth failed, falling back to full authorization');
          // If silent reauth fails, fall back to full authorization
          await wallet.authorize({
            identity: APP_IDENTITY,
          });
        }
      } else {
        // No stored token, do full authorization
        await wallet.authorize({
          identity: APP_IDENTITY,
        });
      }
      
      // Convert addresses to web3.js PublicKey for transaction building
      const fromPubkey = new PublicKey(fromAddress);
      const toPubkey = new PublicKey(toAddress);
      
      // Create the transfer transaction using web3.js (required for mobile wallet adapter compatibility)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: amountLamports,
        })
      );
      
      // Get recent blockhash using @solana/kit
      const { value: blockhashResult } = await rpc.getLatestBlockhash().send();
      transaction.recentBlockhash = blockhashResult.blockhash;
      transaction.feePayer = fromPubkey;
      
      // Sign the transaction using mobile wallet adapter
      const signedTransactions = await wallet.signTransactions({
        transactions: [transaction],
      });
      
      // Serialize the signed transaction to base64
      const serializedTransaction = signedTransactions[0].serialize();
      // Convert to Uint8Array (handles both Buffer and Uint8Array)
      const txBytes = new Uint8Array(serializedTransaction);
      const base64Transaction = fromByteArray(txBytes) as any;
      
      // Send the signed transaction using @solana/kit
      const txSignature = await rpc.sendTransaction(base64Transaction, { encoding: 'base64' }).send();
      
      console.log('Transaction sent, signature:', txSignature);
      
      return txSignature;
    });
    
    // Wait for the transaction to be confirmed before returning
    console.log('Waiting for transaction confirmation...');
    
    // Poll for confirmation (same pattern as airdrop)
    // Note: signature from sendTransaction should already be compatible
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait time
    
    while (!confirmed && attempts < maxAttempts) {
      await sleep(1000); 
      const { value: statuses } = await rpc.getSignatureStatuses([signature as any]).send();
      
      if (statuses?.[0]?.confirmationStatus) {
        confirmed = true;
        console.log('Transaction confirmed!');
      } else {
        attempts++;
        console.log(`Waiting for confirmation... attempt ${attempts}/${maxAttempts}`);
      }
    }
    
    if (!confirmed) {
      console.warn('Transaction confirmation timeout, but transfer may still succeed');
    }
    
    return String(signature);
    
  } catch (error) {
    console.error('Error transferring SOL:', error);
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('auth_token not valid for signing')) {
      throw new Error('Wallet session expired. Please try the transaction again - you may need to approve the authorization request.');
    } else if (errorMessage.includes('Insufficient funds') || errorMessage.includes('insufficient')) {
      throw new Error('Insufficient funds for transfer');
    } else if (errorMessage.includes('Invalid address') || errorMessage.includes('invalid')) {
      throw new Error('Invalid recipient address');
    } else if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
      throw new Error('Transaction was rejected by user');
    } else if (errorMessage.includes('cancelled') || errorMessage.includes('canceled')) {
      throw new Error('Transaction was cancelled');
    }
    
    // Preserve the original error message for other cases
    throw error;
  }
};