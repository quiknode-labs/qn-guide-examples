"use client";

import { useEffect, useMemo } from "react";
import type { Token, SupportedChainId, SwapQuote } from "@/types";
import { APP_CONFIG } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { useSendCalls, useAccount, useWaitForCallsStatus } from "wagmi";
import { useSwapQuotes } from "@/hooks/use-swap-quotes";
import { useSwapBuilder } from "@/hooks/use-swap-builder";
import {
  getTokenSymbolFromAddress,
  getTokenLogoFromAddress,
} from "@/lib/token-config";
import { formatTokenAmount, formatUsdValue, getTokenLogoUrl } from "@/lib/utils";


interface SwapConfigurationProps {
  selectedTokens: string[];
  tokens: Token[];
  outcomeToken: string;
  onExecute: (txHash?: string, isAtomic?: boolean) => void;
  onBack: () => void;
  executing: boolean;
  atomicSupported: boolean;
  chainId: SupportedChainId;
}

export default function SwapConfiguration({
  selectedTokens,
  tokens,
  outcomeToken,
  onExecute,
  onBack,
  executing,
  atomicSupported,
  chainId,
}: SwapConfigurationProps) {
  const { address } = useAccount();
  const { quotes, loading: quotesLoading, fetchQuotes } = useSwapQuotes();
  const {
    sendCalls,
    data: callsId,
    isPending: sendingCalls,
    error: sendCallsError,
  } = useSendCalls();
  const {
    buildSwapCalls,
    loading: buildingCalls,
    error: buildError,
  } = useSwapBuilder();

  // Monitor batch transaction status using wagmi
  const callsIdString = typeof callsId === "string" ? callsId : callsId?.id;
  const {
    data: callsStatus,
    isLoading: isWaitingForCalls,
    isError: callsError,
  } = useWaitForCallsStatus({
    id: callsIdString,
  });

  // Memoize selected tokens data to prevent unnecessary recalculations
  const selectedTokensData = useMemo(() => 
    tokens.filter((token) => selectedTokens.includes(token.contract_address)),
    [tokens, selectedTokens]
  );

  // Stable dependencies for quote fetching
  const stableTokensKey = useMemo(() => 
    selectedTokens.sort().join(','), 
    [selectedTokens]
  );

  const stableBalancesKey = useMemo(() => 
    selectedTokensData.map(t => `${t.contract_address}:${t.balance}`).sort().join(','),
    [selectedTokensData]
  );

  useEffect(() => {
    if (outcomeToken && selectedTokens.length > 0) {
      fetchQuotes(selectedTokens, tokens, outcomeToken, chainId);
    }
  }, [stableTokensKey, stableBalancesKey, outcomeToken, chainId, fetchQuotes, selectedTokens, tokens]);



  // Memoize expensive calculations
  const totalInputValue = useMemo(() => 
    selectedTokensData.reduce((sum, token) => sum + token.quote, 0),
    [selectedTokensData]
  );

  const totalOutputValue = useMemo(() => 
    Object.values(quotes).reduce(
      (sum: number, quote: SwapQuote) => sum + (quote.output?.amount || 0),
      0
    ),
    [quotes]
  );

  const totalOutputValueUsd = useMemo(() => 
    Object.values(quotes).reduce(
      (sum: number, quote: SwapQuote) => sum + (quote.output?.value_usd || 0),
      0
    ),
    [quotes]
  );

  const handleExecuteSwap = async () => {
    if (!address) {
      alert("Wallet not connected");
      return;
    }

    // Prevent multiple executions
    if (buildingCalls || sendingCalls) {
      return;
    }

    try {
      // Build transaction calls for batch execution using real API
      const calls = await buildSwapCalls(
        selectedTokens,
        tokens,
        outcomeToken,
        chainId,
        address
      );

      if (calls.length === 0) {
        throw new Error("No valid swap calls could be built");
      }

      // Execute batch transaction using MetaMask EIP-7702, with fallback for non-supporting wallets
      sendCalls({ calls, experimental_fallback: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error("❌ Error executing swap:", error);
      alert(`Failed to execute swap: ${errorMessage}`);
    }
  };

  // Monitor batch transaction status
  useEffect(() => {
    if (callsStatus) {

      if (callsStatus?.status === "success") {
        
        // Extract the actual transaction hash from receipts for EIP-7702 transactions
        let actualTxHash = callsIdString; // fallback to callsId
        
        if (callsStatus.receipts && callsStatus.receipts.length > 0) {
          // For EIP-7702 batch transactions, use the first receipt's transaction hash
          actualTxHash = callsStatus.receipts[0].transactionHash;
        } else if (atomicSupported) {
          console.warn("⚠️ EIP-7702 transaction confirmed but no receipts found, using callsId for explorer link");
        }
        
        onExecute(actualTxHash, atomicSupported);
      } else if (callsStatus?.status === "pending") {
      } else {
        console.error("❌ Batch transaction failed or reverted:", callsStatus);
        alert("Batch transaction failed. Please try again.");
      }
    }

    if (callsError) {
      console.error("❌ Error waiting for batch transaction:", callsError);
      alert("Error monitoring transaction. Please check your wallet.");
    }
  }, [callsStatus, callsError, callsIdString, onExecute, atomicSupported]);

  if (executing || sendingCalls || isWaitingForCalls) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold mb-2">Executing Swap</h2>
            <p className="text-gray-600 mb-6">
              {sendingCalls
                ? "Please confirm the batch transaction in your wallet..."
                : isWaitingForCalls
                ? "Waiting for batch transaction to be confirmed on-chain..."
                : "Processing batch transaction..."}
            </p>


            {(sendCallsError || buildError || callsError) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  Error:{" "}
                  {sendCallsError?.message ||
                    buildError ||
                    (callsError ? "Transaction monitoring error" : "")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Review Your Swap</h1>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Swap Details</CardTitle>
            </CardHeader>
            <CardContent>
              {quotesLoading ? (
                <div className="space-y-4">
                  {selectedTokensData.map((token) => (
                    <div
                      key={token.contract_address}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getTokenLogoUrl(token, chainId)}
                          alt={token.contract_name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium">
                            {token.contract_ticker_symbol}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTokenAmount(
                              Number(token.balance),
                              token.contract_decimals
                            )}{" "}
                            {token.contract_ticker_symbol} (
                            {formatUsdValue(token.quote)})
                          </div>
                        </div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTokensData.map((token) => {
                    const quote = quotes[token.contract_address];
                    return (
                      <div
                        key={token.contract_address}
                        className="flex items-center justify-between p-3 border rounded-lg min-w-0"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={getTokenLogoUrl(token, chainId)}
                            alt={token.contract_name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="font-medium">
                              {formatTokenAmount(
                                Number(token.balance),
                                token.contract_decimals
                              )}{" "}
                              {token.contract_ticker_symbol}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatUsdValue(token.quote)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center px-4">
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={getTokenLogoFromAddress(outcomeToken, chainId)}
                            alt={getTokenSymbolFromAddress(
                              outcomeToken,
                              chainId
                            )}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="font-medium whitespace-nowrap">
                              {quote?.output?.amount
                                ? `${quote.output.amount.toFixed(
                                    6
                                  )} ${getTokenSymbolFromAddress(
                                    outcomeToken,
                                    chainId
                                  )}`
                                : `0 ${getTokenSymbolFromAddress(
                                    outcomeToken,
                                    chainId
                                  )}`}
                            </div>
                            <div className="text-sm text-gray-500 whitespace-nowrap">
                              {formatUsdValue(quote?.output?.value_usd || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          <Separator className="my-6" />
          <div className="flex items-center justify-between">
          <Button
            onClick={handleExecuteSwap}
            disabled={
              quotesLoading || buildingCalls || Object.keys(quotes).length === 0
            }
            className="w-full"
            size="lg"
          >
            {quotesLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : buildingCalls ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Building Transaction...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                {atomicSupported ? "Execute Sweep" : "Sign Transactions"}
              </>
            )}
          </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Tokens to swap:</span>
                <span className="font-medium">{selectedTokens.length}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Total input value:</span>
                <span className="font-medium">
                  ${totalInputValue.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-gray-600 flex-shrink-0">
                  Expected output:
                </span>
                <div className="text-right flex-shrink-0 min-w-0">
                  <div className="font-medium whitespace-nowrap">
                    ~{totalOutputValue.toFixed(6)}{" "}
                    {getTokenSymbolFromAddress(outcomeToken, chainId)}
                  </div>
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {formatUsdValue(totalOutputValueUsd)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Slippage tolerance:</span>
                <span>{(APP_CONFIG.SLIPPAGE_TOLERANCE * 100).toFixed(1)}%</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction mode:</span>
                <span
                  className={
                    atomicSupported ? "text-green-600" : "text-yellow-600"
                  }
                >
                  {atomicSupported ? "✓ Atomic batch" : "⚡ Individual txs"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {atomicSupported ? "EIP-7702 Benefits" : "Transaction Info"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {atomicSupported ? (
                <>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">
                        Single Transaction
                      </div>
                      <div className="text-xs text-gray-600">
                        All swaps in one atomic transaction
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Gas Efficient</div>
                      <div className="text-xs text-gray-600">
                        No individual approvals needed
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">
                        Multiple Transactions
                      </div>
                      <div className="text-xs text-gray-600">
                        You&apos;ll need to sign each swap individually
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Still Secure</div>
                      <div className="text-xs text-gray-600">
                        Each transaction is independent and safe
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
