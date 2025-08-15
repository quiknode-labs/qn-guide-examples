"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Search, DollarSign } from "lucide-react"
import { formatUnits } from "viem"
import { getTokenLogoUrl } from "@/lib/utils"
import type { Token, ApiStatus, SupportedChainId } from "@/types"


interface TokenPortfolioProps {
  tokens: Token[]
  loading: boolean
  selectedTokens: string[]
  onTokenSelect: (tokenAddress: string, selected: boolean) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  apiStatus?: ApiStatus
  chainId: SupportedChainId
}

export default function TokenPortfolio({
  tokens,
  loading,
  selectedTokens,
  onTokenSelect,
  onSelectAll,
  onDeselectAll,
  apiStatus = 'untested',
  chainId,
}: TokenPortfolioProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showSpam] = useState(false)

  const filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      token.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.contract_ticker_symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const spamFilter = showSpam || !token.is_spam
    const hasValue = token.quote > 0
    return matchesSearch && spamFilter && hasValue
  })

  const totalValue = selectedTokens.reduce((sum, tokenAddr) => {
    const token = tokens.find((t) => t.contract_address === tokenAddr)
    return sum + (token?.quote || 0)
  }, 0)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Your Tokens...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Your Token Portfolio</CardTitle>
            {apiStatus === 'working' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                ✓ Live Data
              </Badge>
            )}
            {apiStatus === 'failed' && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                ⚠ Mock Data
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={onDeselectAll}>
              Deselect All
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {selectedTokens.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedTokens.length} tokens selected</span>
              <span className="text-sm font-bold flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {totalValue.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTokens.map((token) => (
            <div
              key={token.contract_address}
              className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                checked={selectedTokens.includes(token.contract_address)}
                onCheckedChange={(checked) => onTokenSelect(token.contract_address, checked as boolean)}
              />

              <img
                src={getTokenLogoUrl(token, chainId)}
                alt={token.contract_name}
                className="w-10 h-10 rounded-full"
              />

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{token.contract_name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {token.contract_ticker_symbol}
                  </Badge>
                  {token.is_spam && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Spam
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {Number(formatUnits(BigInt(token.balance), token.contract_decimals)).toLocaleString()}
                </div>
              </div>

              <div className="text-right">
                <div className="font-medium">${token.quote.toFixed(2)}</div>
              </div>
            </div>
          ))}

          {filteredTokens.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No tokens found matching your criteria</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
