import type React from "react"
import { formatEther } from "viem"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Zap, Timer, Wallet } from "lucide-react"
import type { ComparisonMetrics } from "@/types"

interface MetricsDisplayProps {
  type: "flashblocks" | "traditional"
  metrics: ComparisonMetrics
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ type, metrics }) => {
  const isFlashblocks = type === "flashblocks"
  const Icon = isFlashblocks ? Zap : Timer
  const title = isFlashblocks ? "Flashblocks" : "Traditional"

  const formatBalance = (balance: bigint) => {
    return Number.parseFloat(formatEther(balance)).toFixed(10)
  }

  const getTransactionStatus = () => {
    if (!metrics.transactionTracker) return null

    const { status, confirmationTime, startTime } = metrics.transactionTracker
    const elapsed = Date.now() - startTime

    if (status === "confirmed") {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Confirmed in {(confirmationTime! / 1000).toFixed(3)}s</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <Clock className="w-4 h-4" />
        <span>Start time: {new Date(startTime).toLocaleString()}</span>
        <span>Pending for {(elapsed / 1000).toFixed(3)}s</span>
      </div>
    )
  }

  return (
    <Card className={`${isFlashblocks ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${isFlashblocks ? "text-blue-600" : "text-gray-600"}`} />
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance */}
        <div>
          <label className="text-sm font-medium text-gray-700">Balance</label>
          <div className="flex items-center gap-2">
            {metrics.balance !== null ? (
              <>
                <span className="text-xl font-mono">{formatBalance(metrics.balance)} ETH</span>
                {metrics.transactionTracker?.balanceAfter !== undefined && (
                  <Badge variant="secondary" className="text-green-600">
                    ✅ Updated
                  </Badge>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Connect wallet</span>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Status */}
        <div>
          <label className="text-sm font-medium text-gray-700">TX Status</label>
          <div className="mt-1">{getTransactionStatus() || <span className="text-gray-500">No transaction</span>}</div>
        </div>
      </CardContent>
    </Card>
  )
}
