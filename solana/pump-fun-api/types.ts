type PumpFunType = 'BUY' | 'SELL';
type PriorityFeeLevel = 'low' | 'medium' | 'high' | 'extreme';
type TokenAmount = string | number;
export type PumpFunRequest = PumpFunQuoteParams | PumpFunSwapParams;
export type HttpRequestMethod = 'GET' | 'POST';
export type PumpFunEndpoint = { 
    path: string; 
    method: HttpRequestMethod 
};

export interface PumpFunQuoteParams {
    type: PumpFunType;
    mint: string;
    amount: TokenAmount;
}

interface PumpFunQuoteMeta {
    isCompleted: boolean;
    outDecimals: number;
    inDecimals: number;
    totalSupply: string;
    currentMarketCapInSol: number;
}

export interface PumpFunQuoteResponse {
    quote: {
        mint: string;
        bondingCurve: string;
        type: PumpFunType;
        inAmount: string;
        inAmountUi: number;
        inTokenAddress: string;
        outAmount: string;
        outAmountUi: number;
        outTokenAddress: string;
        meta: PumpFunQuoteMeta;
    }
}

export interface PumpFunSwapParams {
    wallet: string;
    type: PumpFunType;
    mint: string;
    inAmount: TokenAmount;
    priorityFeeLevel?: PriorityFeeLevel;
    slippageBps?: string;
}

export interface PumpFunSwapResponse {
    tx: string;
}

interface AccountKey {
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
}

interface SwapInstruction {
    keys: AccountKey[];
    programId: string;
    data: number[];
}

export interface PumpFunSwapInstructionsResponse {
    instructions: SwapInstruction[];
}
