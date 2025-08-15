"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Shield, TrendingUp, Info } from "lucide-react"

export default function EIP7702Info() {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          About EIP-7702 Smart Accounts
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            New Standard
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">
          <strong>EIP-7702</strong> enables your regular wallet to temporarily become a smart account, allowing batch
          transactions without deploying a separate smart contract wallet.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">One Transaction</div>
              <div className="text-xs text-gray-600">Batch multiple swaps into a single signature</div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">Secure & Atomic</div>
              <div className="text-xs text-gray-600">All swaps succeed or fail together</div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">Gas Efficient</div>
              <div className="text-xs text-gray-600">No individual approvals needed</div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong className="text-amber-800">Batch Transaction Options:</strong>
              <p className="text-amber-700 mt-1">
                <strong>With Smart Account:</strong> Batch all swaps into one transaction using{" "}
                <strong>MetaMask</strong> when prompted to convert to a smart wallet.
              </p>
              <p className="text-amber-700 mt-1">
                <strong>Without Smart Account:</strong> You can still sweep your tokens! You&apos;ll just need to sign each swap transaction individually.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
