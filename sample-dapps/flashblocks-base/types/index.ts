import type { Hash, TransactionReceipt } from "viem"

export interface TransactionTracker {
  hash: Hash
  status: "pending" | "confirmed"
  confirmationTime?: number
  receipt?: TransactionReceipt
  balanceAfter?: bigint
  startTime: number
}

export interface ComparisonMetrics {
  balance: bigint
  transactionTracker: TransactionTracker | null
}

export interface DemoState {
  flashblocks: ComparisonMetrics
  traditional: ComparisonMetrics
  isTransactionInProgress: boolean
}
