"use client"

import { useState, useCallback, useRef } from "react"
import { formatUnits, parseUnits } from "viem"
import type { SwapQuote, Token, SupportedChainId } from "@/types"
import { APP_CONFIG } from "@/types"



export function useSwapQuotes() {
  const [quotes, setQuotes] = useState<Record<string, SwapQuote>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchKey, setLastFetchKey] = useState<string>("")
  const activeRequestRef = useRef<string | null>(null)

  const fetchQuotes = useCallback(
    async (selectedTokens: string[], tokens: Token[], outcomeTokenAddress: string, chainId: SupportedChainId) => {
      // Create a unique key for this request
      const fetchKey = `${chainId}-${outcomeTokenAddress}-${selectedTokens.sort().join(',')}-${tokens.map(t => `${t.contract_address}:${t.balance}`).sort().join(',')}`
      
      // Skip if we already have this exact request cached
      if (fetchKey === lastFetchKey && Object.keys(quotes).length > 0) {
        return
      }

      // Skip if there's already an active request for this exact data
      if (activeRequestRef.current === fetchKey) {
        return
      }

      setLoading(true)
      setError(null)
      setLastFetchKey(fetchKey)
      activeRequestRef.current = fetchKey

      try {
        const newQuotes: Record<string, SwapQuote> = {}
        

        // Deduplicate tokens to avoid fetching the same token multiple times
        const uniqueTokenAddresses = [...new Set(selectedTokens)]

        // Fetch quotes for each unique selected token
        const quotePromises = uniqueTokenAddresses.map(async (tokenAddr) => {
          const token = tokens.find((t) => t.contract_address === tokenAddr)
          if (!token) return null

          try {
            // Calculate token amount from balance (PRD shows amount as integer, not wei)
            const tokenBalance = BigInt(token.balance)
            // Convert from wei to token units for API call
            const tokenAmount = formatUnits(tokenBalance, token.contract_decimals)

            const quoteUrl = `/api/swap/quote?chainId=${chainId}&from_token=${tokenAddr}&to_token=${outcomeTokenAddress}&amount=${tokenAmount}&slippage=${APP_CONFIG.SLIPPAGE_TOLERANCE}`

            const response = await fetch(quoteUrl)

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
              throw new Error(errorData.error || `Quote API failed: ${response.status}`)
            }

            const data = await response.json()

            // New API response format with input/output objects
            if (data.input && data.output && data.route) {

              return {
                tokenAddr,
                quote: {
                  input: data.input,
                  output: data.output,
                  route: data.route,
                  execution_price: data.execution_price || 0,
                  slippage: data.slippage || APP_CONFIG.SLIPPAGE_TOLERANCE,
                  route_found: true,
                  price_impact: data.price_impact || 0,
                  gas_estimate: data.gas_estimate || "0.002",
                },
              }
            } else {
              console.warn(`⚠️ No route found for ${token.contract_ticker_symbol} - missing required fields:`, {
                input: !!data.input,
                output: !!data.output,
                route: !!data.route
              })
              return null
            }
          } catch (tokenError: unknown) {
            const tokenErrorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error'
            console.error(`Error fetching quote for ${token.contract_ticker_symbol}:`, tokenErrorMessage)
            return null
          }
        })

        const results = await Promise.all(quotePromises)

        // Process results
        for (const result of results) {
          if (result) {
            newQuotes[result.tokenAddr] = result.quote
          }
        }

        setQuotes(newQuotes)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        console.error("Error fetching quotes:", err)
        setError(errorMessage)

        // Fallback to mock quotes on error
        console.log("Using mock quotes due to API error")
        const mockQuotes: Record<string, SwapQuote> = {}
        for (const tokenAddr of selectedTokens) {
          const token = tokens.find((t) => t.contract_address === tokenAddr)
          if (token) {
            mockQuotes[tokenAddr] = {
              input: {
                token: {
                  address: token.contract_address,
                  symbol: token.contract_ticker_symbol,
                  decimals: token.contract_decimals
                },
                amount: Number(formatUnits(BigInt(token.balance), token.contract_decimals)),
                amount_wei: token.balance,
                price_usd: token.quote / Number(formatUnits(BigInt(token.balance), token.contract_decimals)),
                value_usd: token.quote
              },
              output: {
                token: {
                  address: "0x4200000000000000000000000000000000000006", // Mock WETH
                  symbol: "WETH",
                  decimals: 18
                },
                amount: token.quote * 0.98 / 3800,
                amount_wei: parseUnits((token.quote * 0.98 / 3800).toString(), 18).toString(),
                min_amount: token.quote * 0.975 / 3800,
                min_amount_wei: parseUnits((token.quote * 0.975 / 3800).toString(), 18).toString(),
                price_usd: 3800,
                value_usd: token.quote * 0.98
              },
              route: {
                path: [{
                  pool_address: "0x1234567890123456789012345678901234567890",
                  is_stable: false,
                  is_cl: false,
                  hop_number: 1
                }],
                hops: 1,
                type: "direct"
              },
              execution_price: 30.5,
              slippage: APP_CONFIG.SLIPPAGE_TOLERANCE,
              route_found: true,
              price_impact: 0.5,
              gas_estimate: "0.002",
            }
          }
        }
        setQuotes(mockQuotes)
      } finally {
        setLoading(false)
        activeRequestRef.current = null // Clear active request
      }
    },
    [], // No dependencies needed as function doesn't use any external values
  )

  return {
    quotes,
    loading,
    error,
    fetchQuotes,
  }
}
