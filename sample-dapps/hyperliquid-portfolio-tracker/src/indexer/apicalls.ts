import 'dotenv/config';
import { ClearinghouseStateResponse, UserRateLimitResponse, UserVaultEquityResponse, SpotClearinghouseStateResponse, DelegationResponse } from '../shared/types.ts';


const QUICKNODE_ENDPOINT = process.env.QUICKNODE_API_URL!;


export class HyperliquidAPI {
  async getClearinghouseState(walletAddress: string): Promise<ClearinghouseStateResponse> {
    try {
      const payload = {
        type: 'clearinghouseState',
        user: walletAddress
      };

      console.log(`[${new Date().toISOString()}] Fetching clearinghouse state for ${walletAddress}`);

      const response = await fetch(QUICKNODE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Successfully fetched clearinghouse data`);

      return data;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error fetching clearinghouse state:`, error);
      throw error;
    }
  }

  async getUserRateLimit(walletAddress: string): Promise<UserRateLimitResponse> {
    try {
      const payload = {
        type: 'userRateLimit',
        user: walletAddress
      };

      console.log(`[${new Date().toISOString()}] Fetching user rate limit for ${walletAddress}`);

      const response = await fetch(QUICKNODE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Successfully fetched user rate limit data`);

      return data;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error fetching user rate limit:`, error);
      throw error;
    }
  }

  async getUserVaultEquities(walletAddress: string): Promise<UserVaultEquityResponse[]> {
    try {
      const payload = {
        type: 'userVaultEquities',
        user: walletAddress
      };

      console.log(`[${new Date().toISOString()}] Fetching user vault equities for ${walletAddress}`);

      const response = await fetch(QUICKNODE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Successfully fetched user vault equities data`);

      return data;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error fetching user vault equities:`, error);
      throw error;
    }
  }

  async getSpotClearinghouseState(walletAddress: string): Promise<SpotClearinghouseStateResponse> {
    try {
      const payload = {
        type: 'spotClearinghouseState',
        user: walletAddress
      };

      console.log(`[${new Date().toISOString()}] Fetching spot clearinghouse state for ${walletAddress}`);

      const response = await fetch(QUICKNODE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Successfully fetched spot clearinghouse state data`);

      return data;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error fetching spot clearinghouse state:`, error);
      throw error;
    }
  }

  async getDelegations(walletAddress: string): Promise<DelegationResponse[]> {
    try {
      const payload = {
        type: 'delegations',
        user: walletAddress
      };

      console.log(`[${new Date().toISOString()}] Fetching delegations for ${walletAddress}`);

      const response = await fetch(QUICKNODE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Successfully fetched delegations data`);

      return data;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error fetching delegations:`, error);
      throw error;
    }
  }
}