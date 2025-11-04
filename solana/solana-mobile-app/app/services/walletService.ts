import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { APP_IDENTITY } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store auth token for reuse
const AUTH_TOKEN_KEY = 'solana_auth_token';

export const connectWallet = async (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const authorizationResult = await transact(async (wallet: Web3MobileWallet) => {
        const authorizationResult = await wallet.authorize({
          identity: APP_IDENTITY,
        });
        return authorizationResult;
      });

      // Store the auth token for future use
      if (authorizationResult.auth_token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, authorizationResult.auth_token);
      }

      // Use display_address directly (fallback to address if display_address not available)
      const account = authorizationResult.accounts[0];
      const address = (account as any).display_address || account.address;
      resolve(address);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      // Handle specific authorization declined error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('authorization request declined')) {
        reject(new Error('Authorization was declined. Please try connecting again and make sure to approve the request in your wallet.'));
      } else {
        reject(error);
      }
    }
  });
};

export const disconnectWallet = async (): Promise<void> => {
  try {
    // Clear stored auth token
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

export const getStoredAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting stored auth token:', error);
    return null;
  }
};
