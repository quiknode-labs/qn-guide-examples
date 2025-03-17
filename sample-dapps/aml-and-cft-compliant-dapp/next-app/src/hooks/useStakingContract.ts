"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Address, parseEther } from "viem";
import RiskBasedStakingContract from "../lib/RiskBasedStaking";

export function useStakingContract() {
  const { address } = useAccount();
  const [isStaking, setIsStaking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Get contract data
  const { data: stakedBalance, refetch: refetchBalance } = useReadContract({
    address: RiskBasedStakingContract.address as Address,
    abi: RiskBasedStakingContract.abi,
    functionName: "stakedBalances",
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  const { data: riskScore, refetch: refetchRiskScore } = useReadContract({
    address: RiskBasedStakingContract.address as Address,
    abi: RiskBasedStakingContract.abi,
    functionName: "riskScores",
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  const { data: isPending, refetch: refetchPending } = useReadContract({
    address: RiskBasedStakingContract.address as Address,
    abi: RiskBasedStakingContract.abi,
    functionName: "pendingRequests",
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  const { data: riskThreshold, refetch: refetchThreshold } = useReadContract({
    address: RiskBasedStakingContract.address as Address,
    abi: RiskBasedStakingContract.abi,
    functionName: "riskThreshold",
    args: [],
  });

  // Check if user can stake
  const canStake = riskScore
    ? Number(riskScore) >= Number(riskThreshold || 0)
    : false;

  // Prepare contract writes
  const { data: stakeTxHash, writeContract: writeStake } = useWriteContract();
  const { data: withdrawTxHash, writeContract: writeWithdraw } =
    useWriteContract();

  // Monitor transaction status
  const { isLoading: isStakeLoading, isSuccess: isStakeSuccess } =
    useWaitForTransactionReceipt({ hash: stakeTxHash });

  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawTxHash });

  // Handle transaction state
  useEffect(() => {
    setIsStaking(isStakeLoading);
    setIsWithdrawing(isWithdrawLoading);
  }, [isStakeLoading, isWithdrawLoading]);

  // Stake ETH
  const stake = useCallback(
    (amount: string) => {
      if (!address || !canStake) return;

      writeStake({
        address: RiskBasedStakingContract.address as Address,
        abi: RiskBasedStakingContract.abi,
        functionName: "stake",
        value: parseEther(amount),
      });
    },
    [address, canStake, writeStake]
  );

  // Withdraw ETH
  const withdraw = useCallback(
    (amount: string) => {
      if (!address) return;

      writeWithdraw({
        address: RiskBasedStakingContract.address as Address,
        abi: RiskBasedStakingContract.abi,
        functionName: "withdraw",
        args: [parseEther(amount)],
      });
    },
    [address, writeWithdraw]
  );

  // Unified refetch function
  const refetch = async () => {
    await Promise.all([
      refetchBalance(),
      refetchRiskScore(),
      refetchThreshold(),
      refetchPending(),
    ]);
  };

  return {
    stakedBalance,
    riskScore,
    riskThreshold,
    isPending,
    canStake,
    isStaking,
    isWithdrawing,
    stake,
    withdraw,
    isStakeSuccess,
    isWithdrawSuccess,
    refetch,
  };
}
