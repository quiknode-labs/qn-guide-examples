type PriorityFeeLevel = { level: "low" | "medium" | "high" | "extreme" };

interface FeeEstimates {
    extreme: number;
    high: number;
    low: number;
    medium: number;
    percentiles: {
        [key: string]: number;
    };
}

interface EstimatePriorityFeesResponse {
    context: {
        slot: number;
    };
    per_compute_unit: FeeEstimates;
    per_transaction: FeeEstimates;
};

interface EstimatePriorityFeesParams {
    // (Optional) The number of blocks to consider for the fee estimate
    last_n_blocks?: number;
    // (Optional) The program account to use for fetching the local estimate (e.g., Jupiter: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4)
    account?: string;
}

type PriorityFeeQuery = PriorityFeeLevel & EstimatePriorityFeesParams;

type PriorityFeeApi = {
    qn_estimatePriorityFees(params: EstimatePriorityFeesParams): EstimatePriorityFeesResponse;
}

export type { FeeEstimates, EstimatePriorityFeesResponse, EstimatePriorityFeesParams, PriorityFeeLevel, PriorityFeeQuery, PriorityFeeApi };
