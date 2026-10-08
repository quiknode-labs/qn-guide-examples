export type Side = "A" | "B";

export interface NewBookDiff {
  new: {
    sz: string;
    insertBefore?: number | null;
  };
}

export interface UpdateBookDiff {
  update: {
    origSz: string;
    newSz: string;
  };
}

export type RawBookDiff = NewBookDiff | UpdateBookDiff | "remove";

export interface BookEvent {
  user: string;
  oid: number | string;
  coin: string;
  side: Side;
  px: string;
  raw_book_diff: RawBookDiff;
}

export interface OrderStatusEvent {
  user: string;
  status: string;
  statusTimestamp?: number;
  order: {
    coin: string;
    side: Side;
    limitPx: string;
    sz: string;
    oid: number | string;
    origSz?: string;
    tif?: string | null;
    isTrigger?: boolean;
    orderType?: string;
    triggerCondition?: string;
    reduceOnly?: boolean;
  };
}

export interface HypercoreBlock<T> {
  block_number: number;
  block_time: string;
  local_time: string;
  events: T[];
}

export interface ReplayBlock {
  blockNumber: number;
  blockTime: string;
  bookEvents: BookEvent[];
  orderEvents: OrderStatusEvent[];
}

export function isNewDiff(diff: RawBookDiff): diff is NewBookDiff {
  return typeof diff === "object" && "new" in diff;
}

export function isUpdateDiff(diff: RawBookDiff): diff is UpdateBookDiff {
  return typeof diff === "object" && "update" in diff;
}
