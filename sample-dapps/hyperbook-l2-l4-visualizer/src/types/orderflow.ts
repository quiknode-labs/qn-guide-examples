export enum DiffType {
  NEW = "NEW",
  UPDATED = "UPDATED",
  REMOVED = "REMOVED",
  FILLED = "FILLED",
  CANCELED = "CANCELED",
}

export interface L4DiffEvent {
  id: string;
  type: DiffType;
  oid: number;
  user: string;
  side: "Buy" | "Sell";
  coin: string;
  px: string;
  sz: string;
  origSz?: string;
  newSz?: string;
  tif?: string;
  timestamp: number;
  blockHeight: string;
}

export interface L4SnapshotInfo {
  coin: string;
  height: string;
  bidCount: number;
  askCount: number;
  topBid?: string;
  topAsk?: string;
}
