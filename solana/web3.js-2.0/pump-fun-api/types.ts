import { 
    Address, 
    Commitment, 
    Rpc, 
    RpcSubscriptions, 
    SolanaRpcApi, 
    SolanaRpcSubscriptionsApi, 
    TransactionMessageBytesBase64 
} from "@solana/kit";

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
    mint: Address;
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
        mint: Address;
        bondingCurve: Address;
        type: PumpFunType;
        inAmount: string;
        inAmountUi: number;
        inTokenAddress: Address;
        outAmount: string;
        outAmountUi: number;
        outTokenAddress: Address;
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
    tx: TransactionMessageBytesBase64;
}

interface AccountKey {
    pubkey: Address;
    isSigner: boolean;
    isWritable: boolean;
}

interface SwapInstruction {
    keys: AccountKey[];
    programId: Address;
    data: number[];
}

export interface PumpFunSwapInstructionsResponse {
    instructions: SwapInstruction[];
}

export interface SignAndSendTransactionParams {
    transactionBase64: string;
    signerSecretKey: number[];
    solanaRpc: Rpc<SolanaRpcApi>;
    solanaRpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
    commitment?:Commitment;
}