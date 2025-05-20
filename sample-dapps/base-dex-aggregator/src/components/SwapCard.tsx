import { useState, useEffect } from "react";
import { ArrowDown, ChevronDown, ChevronUp, Info } from "lucide-react";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectKitButton } from "connectkit";

import TokenSelector from "./TokenSelector";
import WalletHistory from "./WalletHistory";

import { OPENOCEAN_EXCHANGE_CONTRACT_ADDRESS } from "../lib/constants";

import { useSwapQuote } from "../hooks/useSwapQuote";
import { useGasEstimate } from "../hooks/useGasEstimate";
import { useERC20Approval } from "../hooks/useERC20Approval";
import { useTokenContext } from "../context/TokenContext";
import { executeSwap } from "../lib/api";
import { formatUnits } from "viem";
import { toast } from "react-hot-toast";

export default function SwapCard() {
  const { address, isConnected } = useAccount();

  const [amount, setAmount] = useState("");
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showDexList, setShowDexList] = useState(false);

  const {
    fromToken,
    toToken,
    setFromToken,
    setToToken,
    refreshBalances,
    tokenBalances,
  } = useTokenContext();

  const { gasEstimates, isLoadingGas, fetchGasEstimatesNow } =
    useGasEstimate() as {
      gasEstimates: { price: number }[] | null;
      isLoadingGas: boolean;
      fetchGasEstimatesNow: () => void;
    };
  const selectedGasPrice = gasEstimates?.[0]?.price || 0;

  const { quote, isLoadingQuote } = useSwapQuote({
    fromToken,
    toToken,
    amount,
    gasPrice: selectedGasPrice.toString(),
  });

  const formattedFromBalance =
    fromToken && tokenBalances[fromToken.address]
      ? formatUnits(
          BigInt(tokenBalances[fromToken.address]),
          fromToken.decimals
        )
      : "0";
  const formattedToBalance =
    toToken && tokenBalances[toToken.address]
      ? formatUnits(BigInt(tokenBalances[toToken.address]), toToken.decimals)
      : "0";

  const currentBalance = parseFloat(formattedFromBalance);
  const inputAmount = parseFloat(amount) || 0;
  const notEnoughBalance = inputAmount > currentBalance;

  const {
    isApproved,
    isLoading: isApprovalLoading,
    isError: isApprovalError,
    approve,
    error: approvalError,
  } = useERC20Approval({
    tokenAddress: fromToken?.address || "0x0",
    spenderAddress: OPENOCEAN_EXCHANGE_CONTRACT_ADDRESS,
    amount: amount || "0",
    decimals: fromToken?.decimals || 18,
  });

  // Wagmi hooks for sending and tracking the transaction
  const {
    data: hash,
    isPending: isTxPending,
    sendTransaction,
    error: txError,
  } = useSendTransaction();
  const {
    isLoading: isTxConfirming,
    isSuccess: isTxSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash, // Wait for the transaction with this hash to be confirmed
  });

  useEffect(() => {
    if (isConnected && address) {
      refreshBalances();
    }
  }, [isConnected, address, refreshBalances, fromToken, toToken]);

  useEffect(() => {
    if (amount && fromToken && toToken) {
      fetchGasEstimatesNow();
    }
  }, [amount, fromToken, toToken, fetchGasEstimatesNow]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isTxSuccess && hash) {
      toast.success(`Swap confirmed!`);
      setAmount(""); // Reset input amount
      refreshBalances(); // Refresh balances after successful swap
      setIsSwapping(false);
    }
  }, [isTxSuccess, hash, toast, refreshBalances]);

  // Handle transaction errors
  useEffect(() => {
    if (txError || receiptError) {
      toast.error(`Swap failed! Check console for details.`);
      console.error("Transaction error:", txError || receiptError);
      setIsSwapping(false);
    }
  }, [txError, receiptError, toast]);

  function handleReverseTokens() {
    if (fromToken && toToken) {
      setFromToken(toToken);
      setToToken(fromToken);
    }
  }

  async function handleSwap() {
    if (!fromToken || !toToken || !amount || !address) return;
    try {
      setIsSwapping(true);

      const swapData = await executeSwap({
        inTokenAddress: fromToken.address,
        outTokenAddress: toToken.address,
        amount: amount,
        slippage: "1",
        gasPrice: selectedGasPrice.toString(),
        userAddress: address,
      });

      const txRequest = {
        to: swapData.to,
        data: swapData.data,
        value: BigInt(swapData.value),
        gasPrice: BigInt(swapData.gasPrice),
      };

      sendTransaction(txRequest); // Send the transaction (hash will be tracked by useWaitForTransactionReceipt)
    } catch (error: any) {
      console.error("Swap execution error:", error);
      toast.error("Swap failed. An unexpected error occurred.");
      setIsSwapping(false);
    }
  }

  async function handleApprove() {
    try {
      await approve();
      toast.success("Token approval successful.");
      return true;
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error("Approval failed.");
      return false;
    }
  }

  async function handleApproveAndSwap() {
    try {
      setIsSwapping(true);
      const approved = await handleApprove();
      if (approved) {
        await handleSwap();
      }
    } catch (error: any) {
      console.error("Approve & Swap error:", error);
      toast.error("Approve & Swap failed.");
      setIsSwapping(false);
    }
  }

  let buttonLabel = "Confirm Swap";
  if (notEnoughBalance) {
    buttonLabel = "Not enough balance";
  } else if (isSwapping || isApprovalLoading || isTxPending || isTxConfirming) {
    buttonLabel = "Processing...";
  } else if (!isConnected) {
    buttonLabel = "Connect Wallet";
  } else if (!fromToken || !toToken) {
    buttonLabel = "Select Tokens";
  } else if (!amount) {
    buttonLabel = "Enter Amount";
  } else if (!isApproved) {
    buttonLabel = "Approve & Swap";
  }

  const isButtonDisabled =
    !isConnected ||
    !fromToken ||
    !toToken ||
    !amount ||
    isSwapping ||
    isApprovalLoading ||
    isTxPending ||
    isTxConfirming ||
    isLoadingQuote ||
    notEnoughBalance;

  const sortedDexes = quote?.dexes
    ? [...quote.dexes].sort((a, b) => {
        const amountA = BigInt(a.swapAmount || "0");
        const amountB = BigInt(b.swapAmount || "0");
        return amountB > amountA ? 1 : amountB < amountA ? -1 : 0;
      })
    : [];
  const formattedDexes = sortedDexes.map((dex) => {
    const amt = BigInt(dex.swapAmount || "0");
    const formattedAmount = formatUnits(amt, toToken?.decimals || 18);
    return { ...dex, formattedAmount };
  });

  const formattedOutputAmount = quote?.outAmount
    ? formatUnits(BigInt(quote.outAmount), toToken?.decimals || 18)
    : "0";

  async function onMainButtonClick() {
    if (notEnoughBalance) return;
    if (isApproved) {
      await handleSwap();
    } else if (parseFloat(amount) > 0) {
      await handleApproveAndSwap();
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="gradient-border shadow-lg mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Base DEX Aggregator</h1>
            <ConnectKitButton showBalance={false} theme="soft" />
          </div>

          {/* FROM TOKEN + AMOUNT */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <div className="flex items-start space-x-2">
              <div className="flex-1">
                <TokenSelector
                  selectedToken={fromToken}
                  onSelectToken={setFromToken}
                  otherToken={toToken}
                />
                {fromToken && (
                  <div className="mt-1 text-sm text-gray-500">
                    Balance: {formattedFromBalance} {fromToken.symbol}{" "}
                    {fromToken.usd && (
                      <span>
                        ($
                        {(
                          parseFloat(formattedFromBalance) *
                          parseFloat(fromToken.usd)
                        ).toFixed(2)}
                        )
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value.startsWith(".")) {
                      value = "0" + value; // Prepend 0 if input starts with a decimal point
                    }
                    if (/^\d*\.?\d*$/.test(value)) {
                      setAmount(value);
                    }
                  }}
                  placeholder="0.0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Reverse tokens button */}
          <div className="flex justify-center my-4">
            <button
              onClick={handleReverseTokens}
              className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowDown size={20} />
            </button>
          </div>

          {/* TO TOKEN + OUTPUT */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <div className="flex items-start space-x-2">
              <div className="flex-1">
                <TokenSelector
                  selectedToken={toToken}
                  onSelectToken={setToToken}
                  otherToken={fromToken}
                />
                {toToken && (
                  <div className="mt-1 text-sm text-gray-500">
                    Balance: {formattedToBalance} {toToken.symbol}{" "}
                    {toToken.usd && (
                      <span>
                        ($
                        {(
                          parseFloat(formattedToBalance) *
                          parseFloat(toToken.usd)
                        ).toFixed(2)}
                        )
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={formattedOutputAmount}
                  readOnly
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Swap Details (Quote info) */}
          <div className="mb-6">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Swap Details
                </span>
              </div>
              {amount && fromToken && toToken && !isLoadingQuote && quote ? (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Price Impact</span>
                    <span
                      className={
                        parseFloat(
                          quote.price_impact?.replace("%", "") || "0"
                        ) < 0
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    >
                      {quote.price_impact || "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Estimated Gas (units)</span>
                    <span>{quote.estimatedGas}</span>
                  </div>
                  {typeof quote.save !== "undefined" && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-1">Savings</span>
                        <div className="relative group">
                          <Info size={14} className="text-gray-400" />
                          <div className="absolute z-10 -top-2 left-full ml-2 w-48 p-2 bg-white rounded shadow-lg text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
                            Estimated savings compared to a standard swap.
                          </div>
                        </div>
                      </div>
                      <span
                        className={
                          quote.save > 0 ? "text-green-500" : "text-gray-500"
                        }
                      >
                        ${quote.save.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {quote.dexes && quote.dexes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600">Top DEXes</span>
                        <button
                          onClick={() => setShowDexList(!showDexList)}
                          className="text-blue-600 text-xs"
                        >
                          {showDexList ? "Hide All" : "View All"}
                        </button>
                      </div>
                      <div className="text-xs">
                        {(showDexList
                          ? formattedDexes
                          : formattedDexes.slice(0, 3)
                        ).map((dex, index) => {
                          const shortAmount = parseFloat(
                            dex.formattedAmount
                          ).toFixed(4);
                          return (
                            <div
                              key={index}
                              className="flex justify-between mb-0.5"
                            >
                              <span>{dex.dexCode}</span>
                              <span>
                                {shortAmount} {toToken?.symbol}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {quote.path && (
                    <div className="mt-4">
                      <div className="bg-gray-50 p-3 rounded-lg text-sm">
                        <div className="mb-3 text-gray-700 font-medium">
                          Swap Route
                        </div>
                        <div className="flex items-center mb-3">
                          <div className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {quote.path.parts} parts
                          </div>
                          <div className="mx-2 text-gray-400">|</div>
                          <div className="text-gray-600 text-xs">
                            {quote.path.from.slice(0, 6)}...
                            {quote.path.from.slice(-4)} →{" "}
                            {quote.path.to.slice(0, 6)}...
                            {quote.path.to.slice(-4)}
                          </div>
                        </div>
                        {quote.path.routes?.map((route, routeIndex) => (
                          <div key={routeIndex} className="mb-4">
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 text-xs font-medium">
                                {routeIndex + 1}
                              </div>
                              <div className="ml-2 text-sm font-medium">
                                Route {routeIndex + 1} ({route.percentage}%)
                              </div>
                            </div>
                            {route.subRoutes?.map((subRoute, subIndex) => (
                              <div
                                key={subIndex}
                                className="ml-6 mb-4 p-2 bg-gray-100 rounded"
                              >
                                <div className="flex items-center mb-2 space-x-2">
                                  <span className="text-xs font-medium text-gray-600">
                                    From→To:
                                  </span>
                                  <span className="font-mono text-xs">
                                    {subRoute.from.slice(0, 6)}...
                                    {subRoute.from.slice(-4)}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-mono text-xs">
                                    {subRoute.to.slice(0, 6)}...
                                    {subRoute.to.slice(-4)}
                                  </span>
                                </div>
                                {subRoute.dexes?.map((dex, dexIndex) => (
                                  <div
                                    key={dexIndex}
                                    className="mb-2 pl-3 border-l border-gray-300"
                                  >
                                    <div className="flex items-center text-xs mb-1">
                                      <span className="mr-2 font-medium w-40">
                                        {dex.dex}
                                      </span>
                                      <div className="flex-1 relative h-2 bg-gray-200 rounded mr-2">
                                        <div
                                          className="absolute top-0 left-0 h-2 bg-blue-500 rounded"
                                          style={{
                                            width: `${dex.percentage}%`,
                                          }}
                                        />
                                      </div>
                                      <span>{dex.percentage}%</span>
                                    </div>
                                    <div className="text-gray-500 text-xs ml-2">
                                      Fee: {(dex.fee * 100).toFixed(2)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-500 italic">
                  {isLoadingQuote
                    ? "Loading quote..."
                    : "Enter an amount to see swap details"}
                </div>
              )}
            </div>
          </div>

          {/* MAIN BUTTON: Approve & Swap or just Swap */}
          <div className="flex space-x-2">
            <button
              onClick={onMainButtonClick}
              disabled={isButtonDisabled}
              className={`flex-1 py-3 px-4 rounded-md font-medium text-white transition-colors ${
                isButtonDisabled
                  ? "bg-gray-400"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              }`}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Wallet & History */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">Wallet & History</span>
          {isHistoryExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </button>
        {isHistoryExpanded && <WalletHistory />}
      </div>
    </div>
  );
}
