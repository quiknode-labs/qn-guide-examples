"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Wallet, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"
import WalletConnection from "@/components/wallet-connection"
import TokenPortfolio from "@/components/token-portfolio"
import SwapConfiguration from "@/components/swap-configuration"
import SocialCard from "@/components/social-card"
import EIP7702Info from "@/components/eip-7702-info"
import Footer from "@/components/footer"
import { useAccount, useChainId, useCapabilities, useAccountEffect } from "wagmi"
import { Address, Hash } from "viem"
import { useTokenBalances } from "@/hooks/use-token-balances"
import { useOutcomeTokens } from "@/hooks/use-outcome-tokens"
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { validateEnvironment, logEnvironmentStatus } from "@/lib/env-validation"
import { getChainName } from "@/lib/config"
import type { SupportedChainId, SwapResult } from "@/types"
import { APP_CONFIG } from "@/types"

export default function TokenSweeperApp() {
  const { address, status } = useAccount()
  const chainId = useChainId()
  const { data: capabilities } = useCapabilities({ account: address })

  const { tokens, loading, refetch, apiStatus } = useTokenBalances(address, chainId as SupportedChainId)
  const { tokens: outcomeTokens, loading: outcomeTokensLoading } = useOutcomeTokens(chainId as SupportedChainId)
  const [selectedTokens, setSelectedTokens] = useState<string[]>([])
  const [outcomeToken, setOutcomeToken] = useState("")
  const [swapStep, setSwapStep] = useState<"select" | "configure" | "execute" | "success">("select")
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null)
  const [envStatus, setEnvStatus] = useState<ReturnType<typeof validateEnvironment> | null>(null)

  // Check if atomic batch is supported
  const atomicSupported =
    capabilities?.[chainId]?.atomic?.status === "supported" ||
    capabilities?.[chainId]?.atomic?.status === "ready";

  // Validate environment on mount
  useEffect(() => {
    const result = logEnvironmentStatus()
    setEnvStatus(result)
    
    // Show user-friendly warnings for missing configuration
    if (!result.isValid) {
      console.warn('⚠️ Production configuration incomplete. Some features may use mock data.')
    }
  }, [])

  useEffect(() => {
    if (status === 'connected' && address) {
      refetch()
    }
  }, [status, address, chainId, refetch]) // Include refetch for proper dependency tracking

  // Handle account connection/disconnection events
  useAccountEffect({
    onConnect() {
    },
    onDisconnect() {
      setSelectedTokens([])
      setOutcomeToken("")
      setSwapResult(null) 
      setSwapStep("select")
    },
  })

  // Clear state when wallet address changes
  useEffect(() => {
    setSelectedTokens([])
    setOutcomeToken("")
    setSwapResult(null)
    setSwapStep("select")
  }, [address])

  const handleTokenSelection = (tokenAddress: string, selected: boolean) => {
    if (selected) {
      setSelectedTokens((prev) => [...prev, tokenAddress])
    } else {
      setSelectedTokens((prev) => prev.filter((addr) => addr !== tokenAddress))
    }
  }

  const handleSelectAll = () => {
    const selectableTokens = tokens.filter((token) => !token.is_spam && token.quote > 0)
    setSelectedTokens(selectableTokens.map((token) => token.contract_address))
  }

  const handleDeselectAll = () => {
    setSelectedTokens([])
  }

  const handlePrepareSwap = () => {
    if (selectedTokens.length > 0 && outcomeToken) {
      setSwapStep("configure")
    }
  }

  const handleExecuteSwap = async (txHash?: string, isAtomic?: boolean) => {
    if (txHash) {
      const totalValue = selectedTokens.reduce((sum, tokenAddr) => {
        const token = tokens.find((t) => t.contract_address === tokenAddr)
        return sum + (token?.quote || 0)
      }, 0)

      setSwapResult({
        tokensSwapped: selectedTokens.length,
        totalValue,
        outcomeToken: outcomeToken as Address,
        chain: getChainName(chainId as SupportedChainId),
        txHash: txHash as Hash,
        chainId: chainId as SupportedChainId,
        isAtomic: isAtomic ?? atomicSupported,
      })
      setSwapStep("success")
    }
  }

  const handleNewSweep = () => {
    setSelectedTokens([])
    setOutcomeToken("")
    setSwapResult(null)
    setSwapStep("select")
    refetch()
  }


  if (status !== 'connected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-lg mb-6">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-xl text-gray-900">
                  Token Sweeper
                </span>
              </div>
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Clean Up Your Wallet Dust
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Swap multiple small token balances into one preferred token with a
              single transaction. Powered by EIP-7702 for the ultimate user
              experience.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    Connect Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Connect your wallet to view your token portfolio
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Select Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Choose which dust tokens you want to consolidate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    One-Click Sweep
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Execute all swaps in a single transaction
                  </p>
                </CardContent>
              </Card>
            </div>

            <WalletConnection />

            <div className="mt-12 mb-12">
              <EIP7702Info />
            </div>

          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (swapStep === "success" && swapResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Wallet Dust Cleared!</h1>
              <p className="text-lg text-gray-600">Your tokens have been successfully consolidated</p>
            </div>

            <SocialCard result={swapResult} />

            <div className="mt-8 flex gap-4 justify-center">
              <Button onClick={handleNewSweep} size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                New Sweep
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-xl">Token Sweeper</span>
            </div>

            <div className="flex items-center gap-4">
              {envStatus && !envStatus.isValid && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Dev Mode
                </Badge>
              )}
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!atomicSupported && (
          <div className="mb-8">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 rounded-full p-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">Individual Transactions Mode</h3>
                  <p className="text-amber-700 text-sm mb-3">
                    Your wallet doesn&apos;t support batch transactions yet. You can still sweep your tokens by signing each swap individually, or upgrade to a smart account for one-click batch transactions.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
                  >
                    Learn More About EIP-7702
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {swapStep === "select" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TokenPortfolio
                tokens={tokens}
                loading={loading}
                selectedTokens={selectedTokens}
                onTokenSelect={handleTokenSelection}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                apiStatus={apiStatus}
                chainId={chainId as SupportedChainId}
              />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sweep Summary</CardTitle>
                  <CardDescription>Selected {selectedTokens.length} tokens to sweep</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Receive Token</label>
                      <select
                        value={outcomeToken}
                        onChange={(e) => setOutcomeToken(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={outcomeTokensLoading}
                      >
                        <option value="">{outcomeTokensLoading ? "Loading tokens..." : "Select token..."}</option>
                        {outcomeTokens.map((token) => (
                          <option key={token.address} value={token.address}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Separator />

                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Slippage:</span>
                        <span>{(APP_CONFIG.SLIPPAGE_TOLERANCE * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Batch Support:</span>
                        <span className={atomicSupported ? "text-green-600" : "text-amber-600"}>
                          {atomicSupported ? "✓ Available" : "⚠ Upgrade Required"}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handlePrepareSwap}
                      disabled={selectedTokens.length === 0 || !outcomeToken}
                      className="w-full"
                      size="lg"
                    >
                      Prepare Swap
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {(swapStep === "configure" || swapStep === "execute") && (
          <SwapConfiguration
            selectedTokens={selectedTokens}
            tokens={tokens}
            outcomeToken={outcomeToken}
            onExecute={handleExecuteSwap}
            onBack={() => setSwapStep("select")}
            executing={swapStep === "execute"}
            atomicSupported={atomicSupported}
            chainId={chainId as SupportedChainId}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
