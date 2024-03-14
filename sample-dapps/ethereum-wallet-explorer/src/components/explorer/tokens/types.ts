export interface TokenAmount {
    amount: string;
    decimals: number;
    uiAmount: number;
    uiAmountString: string;
  }
  
  export interface TokenInfo {
    isNative: boolean;
    mint: string;
    owner: string;
    state: string;
    tokenAmount: TokenAmount;
  }
  
  export interface ParsedData {
    info: TokenInfo;
    type: string;
  }
  
  export interface TokenData {
    parsed: ParsedData;
    program: string;
    space: number;
  }
  
  export interface Account {
    data: TokenData;
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: number;
    space: number;
  }
  
  export interface Token {
    account: Account;
    pubkey: string;
  }
  
  export interface TokensResponse {
    tokens: Token[];
  }
  
 export interface JupToken {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    logoURI: string;
  }