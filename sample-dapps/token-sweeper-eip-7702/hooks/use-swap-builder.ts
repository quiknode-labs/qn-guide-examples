"use client"

import { useState, useCallback } from "react"
import { formatUnits, type Address, type Hex } from "viem"
import type { SwapCall, SwapBuildParams, Token, SupportedChainId } from "@/types"
import { APP_CONFIG } from "@/types"



// Note: With EIP-7702 and MetaMask, we don't need a separate Sweeper contract
// MetaMask handles the delegation and batch execution automatically

export function useSwapBuilder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildSwapCalls = useCallback(
    async (
      selectedTokens: string[],
      tokens: Token[],
      outcomeTokenAddress: string,
      chainId: SupportedChainId,
      userWalletAddress: string,
    ): Promise<SwapCall[]> => {
      setLoading(true)
      setError(null)

      try {
        const calls: SwapCall[] = []

        // Build swap calls for each selected token
        const buildPromises = selectedTokens.map(async (tokenAddr) => {
          const token = tokens.find((t) => t.contract_address === tokenAddr)
          if (!token) return []

          try {
            
            // Convert balance from wei to token units for API (as per PRD spec)
            const tokenAmount = formatUnits(BigInt(token.balance), token.contract_decimals)
            
            const buildParams: SwapBuildParams = {
              from_token: tokenAddr as Address,
              to_token: outcomeTokenAddress as Address,
              amount: tokenAmount, // Convert to token units, not wei
              wallet_address: userWalletAddress as Address, // User's actual wallet address
              slippage: APP_CONFIG.SLIPPAGE_TOLERANCE,
            }

            const buildUrl = `/api/swap/build?chainId=${chainId}`

            const response = await fetch(buildUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(buildParams),
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
              throw new Error(errorData.error || `Build API failed: ${response.status}`)
            }

            const data = await response.json()

            
            // Based on PRD spec: response should have success=true and transactions array
            if (data.success && data.transactions && Array.isArray(data.transactions)) {
              // Return all transactions (approval and swap) for batch execution
              const transactionCalls: SwapCall[] = []
              
              for (const tx of data.transactions) {
                if (tx.transaction) {
                  transactionCalls.push({
                    to: tx.transaction.to as Address,
                    data: tx.transaction.data as Hex,
                    value: BigInt(tx.transaction.value || 0),
                  })
                }
              }

              if (transactionCalls.length > 0) {
                return transactionCalls
              } else {
                console.warn(`⚠️ No transactions found for ${token.contract_ticker_symbol} in:`, data.transactions)
                return []
              }
            } else {
              console.error(`❌ Invalid build response format for ${token.contract_ticker_symbol}:`, data)
              throw new Error(`Invalid build response format - success: ${data.success}, transactions: ${Array.isArray(data.transactions)}`)
            }
          } catch (tokenError: unknown) {
            const tokenErrorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error'
            console.error(`Error building swap for ${token.contract_ticker_symbol}:`, tokenErrorMessage)
            return []
          }
        })

        const results = await Promise.all(buildPromises)

        // Flatten all transaction arrays into a single calls array
        for (const result of results) {
          if (Array.isArray(result) && result.length > 0) {
            calls.push(...result)
          }
        }

        return calls
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        console.error("Error building swap calls:", err)
        setError(errorMessage)

        // Return mock calls on error
        console.log("Using mock swap calls due to API error")
        const mockCalls: SwapCall[] = selectedTokens.map(() => ({
          to: "0x6Cb442acF35158D5eDa88fe602221b67B400Be3E" as Address,
          data: "0x24856bc3000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020" as Hex,
          value: BigInt(0),
        }))

        return mockCalls
      } finally {
        setLoading(false)
      }
    },
    [], // No dependencies needed as function doesn't use any external values
  )

  return {
    buildSwapCalls,
    loading,
    error,
  }
}
