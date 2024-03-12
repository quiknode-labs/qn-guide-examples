
interface RequestPayload {
    method: string;
    params: {
        last_n_blocks: number;
        account: string;
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
    };
    id: number;
}

interface EstimatePriorityFeesParams {
    // (Optional) The number of blocks to consider for the fee estimate
    last_n_blocks?: number;
    // (Optional) The program account to use for fetching the local estimate (e.g., Jupiter: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4)
    account?: string;
    // Your Add-on Endpoint (found in your QuickNode Dashboard - https://dashboard.quicknode.com/endpoints)
    endpoint: string;
}

export type { RequestPayload, FeeEstimates, ResponseData, EstimatePriorityFeesParams };