/* -- PRIORITY FEES API -- */

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
    recommended: number;
};

interface EstimatePriorityFeesParams {
    last_n_blocks?: number;
    account?: string;
    api_version?: number;
}

/* -- METIS API -- */

declare const QuoteGetSwapModeEnum: {
    readonly ExactIn: "ExactIn";
    readonly ExactOut: "ExactOut";
};
type QuoteGetSwapModeEnum = typeof QuoteGetSwapModeEnum[keyof typeof QuoteGetSwapModeEnum];

declare const SwapMode: {
    readonly ExactIn: "ExactIn";
    readonly ExactOut: "ExactOut";
};
type SwapMode = typeof SwapMode[keyof typeof SwapMode];

interface QuoteGetRequest {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
    swapMode?: QuoteGetSwapModeEnum;
    dexes?: Array<string>;
    excludeDexes?: Array<string>;
    restrictIntermediateTokens?: boolean;
    onlyDirectRoutes?: boolean;
    asLegacyTransaction?: boolean;
    platformFeeBps?: number;
    maxAccounts?: number;
}

interface PlatformFee {
    amount?: string;
    feeBps?: number;
}

interface RoutePlanStep {
    swapInfo: SwapInfo;
    percent: number;
}

interface SwapInfo {
    ammKey: string;
    label?: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
}

interface QuoteResponse {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: SwapMode;
    slippageBps: number;
    platformFee?: PlatformFee;
    priceImpactPct: string;
    routePlan: Array<RoutePlanStep>;
    contextSlot?: number;
    timeTaken?: number;
}

/* -- IPFS API -- */

interface IpfsUploadRequest {
    filePath: string;
    fileName: string;
    fileType: string;
}

interface Pin {
    cid: string;
    name: string;
    origins: string[];
    meta: Record<string, any>;
}

interface Info {
    size: string;
}

interface IpfsUploadResponse {
    requestid: string;
    status: string;
    created: string;
    pin: Pin;
    info: Info;
    delegates: string[];
}

export type { 
    FeeEstimates, 
    EstimatePriorityFeesResponse, 
    EstimatePriorityFeesParams,
    QuoteGetRequest,
    QuoteResponse,
    IpfsUploadRequest,
    IpfsUploadResponse
};