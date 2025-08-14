"use client"

import type React from "react"
import { useEffect } from "react"
import { useAccount } from "wagmi"
import { useTransactionTracking } from "@/hooks/use-transaction-tracking"
import { useBalanceTracker } from "@/hooks/use-balance-tracker"
import { MetricsDisplay } from "./metrics-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, AlertCircle, ExternalLink } from "lucide-react"
import type { ComparisonMetrics } from "@/types"
import { QUICKNODE_LINKS } from "@/lib/constants"

export const ComparisonPanel: React.FC = () => {
  const { isConnected, address } = useAccount()

  const { sendTransaction, resetTransactions, flashblocksTracker, traditionalTracker, isTransactionInProgress } =
    useTransactionTracking()

  // Track balances for both sides
  const flashBalance = useBalanceTracker(address, "flashblocks");
  const tradBalance = useBalanceTracker(address, "traditional");

  // Update balance when transaction tracking provides new values
  useEffect(() => {
    if (flashblocksTracker?.balanceAfter !== undefined) {
      flashBalance.updateBalance(flashblocksTracker.balanceAfter);
    }

  }, [flashblocksTracker?.balanceAfter, flashBalance.updateBalance, ]);

  useEffect(() => {
    if (traditionalTracker?.balanceAfter !== undefined) {
      tradBalance.updateBalance(traditionalTracker.balanceAfter);
    }

  }, [traditionalTracker?.balanceAfter, tradBalance.updateBalance]);

  const flashMetrics: ComparisonMetrics = {
    balance: isConnected ? flashBalance.balance : BigInt(0),
    transactionTracker: flashblocksTracker,
  }

  const tradMetrics: ComparisonMetrics = {
    balance: isConnected ? tradBalance.balance : BigInt(0),
    transactionTracker: traditionalTracker,
  }

  return (
    <div className="space-y-6">
      {!isConnected && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Connect your wallet to unlock full features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsDisplay type="flashblocks" metrics={flashMetrics} />
        <MetricsDisplay type="traditional" metrics={tradMetrics} />
      </div>

      {/* Transaction Controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-3 w-full max-w-md">
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.open(QUICKNODE_LINKS.FAUCET, "_blank")}
          >
            Get Testnet ETH
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          {isConnected ? (
            <Button
              onClick={sendTransaction}
              disabled={isTransactionInProgress}
              size="lg"
              className="flex-1"
            >
              {isTransactionInProgress
                ? "Transaction in Progress..."
                : "Send 0.0001 ETH Test Transaction"}
            </Button>
          ) : (
            <Button disabled size="lg" className="flex-1">
              <AlertCircle className="w-4 h-4 mr-2" />
              Connect Wallet to Send Test Transaction
            </Button>
          )}
        </div>

        {(flashblocksTracker || traditionalTracker) && (
          <Button onClick={resetTransactions} variant="outline" size="sm">
            Reset Demo
          </Button>
        )}
      </div>
    </div>
  );
}
