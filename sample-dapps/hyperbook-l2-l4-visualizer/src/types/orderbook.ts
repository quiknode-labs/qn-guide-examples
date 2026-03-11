export interface L2Level {
  px: string;
  sz: string;
  n: number;
  pxFloat: number;
  szFloat: number;
}

export interface L2BookState {
  coin: string;
  time: string;
  blockNumber: string;
  bids: L2Level[];
  asks: L2Level[];
}
