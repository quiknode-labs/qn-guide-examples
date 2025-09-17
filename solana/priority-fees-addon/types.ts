interface RequestPayload {
    method: string;
    params: {
      last_n_blocks: number;
      account: string;
      api_version: number;
    };
    id: number;
    jsonrpc: string;
  }
  
  interface FeeEstimates {
    extreme: number;
    high: number;
    low: number;
    medium: number;
    percentiles: {
      [key: string]: number;
    };
  }
  
  interface ResponseData {
    jsonrpc: string;
    result: {
      context: {
        slot: number;
      };
      per_compute_unit: FeeEstimates;
      per_transaction: FeeEstimates;
      recommended: number;
    };
    id: number;
  }
  
  interface EstimatePriorityFeesParams {
    // (Optional) The number of blocks to consider for the fee estimate
    last_n_blocks?: number;
    // (Optional) The program account to use for fetching the local estimate (e.g., Jupiter: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4)
    account?: string;
    // (optional) The API version to use for the request (default: 1)
    api_version?: number;
    // Your Add-on Endpoint (found in your QuickNode Dashboard - https://dashboard.quicknode.com/endpoints)
    endpoint: string;
  }
  
  interface EstimatePriorityFeesResponse {
    context: {
        slot: number;
    };
    per_compute_unit: FeeEstimates;
    per_transaction: FeeEstimates;
    recommended: number;
  }
  
  interface SolanaKitEstimatePriorityFeesResponse {
    id: string;
    jsonrpc: string;
    result: {
      context: {
          slot: number;
      };
      per_compute_unit: FeeEstimates;
      per_transaction: FeeEstimates;
      recommended: number;
    };
  }
  
  interface SolanaKitEstimatePriorityFeesParams {
    last_n_blocks?: number;
    account?: string;
    api_version?: number;
  }
  
  export type {
    RequestPayload,
    FeeEstimates,
    ResponseData,
    EstimatePriorityFeesParams,
    EstimatePriorityFeesResponse, 
    SolanaKitEstimatePriorityFeesParams,
    SolanaKitEstimatePriorityFeesResponse
  };
  