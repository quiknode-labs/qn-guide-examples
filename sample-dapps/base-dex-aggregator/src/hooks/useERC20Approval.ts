import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, type Address } from "viem";
import { erc20Abi } from "viem";
import { NATIVE_TOKEN_ERC20_ADDRESS } from "../lib/constants";

interface UseERC20ApprovalParams {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: string;
  decimals?: number;
}

interface UseERC20ApprovalReturn {
  isApproved: boolean;
  isLoading: boolean;
  isError: boolean;
  allowance: bigint;
  approve: () => Promise<void>;
  error: Error | null;
}

/**
 * Custom hook to check and manage ERC20 token approvals
 * @param tokenAddress - The address of the ERC20 token
 * @param spenderAddress - The address of the contract that will spend the tokens
 * @param amount - The amount of tokens to approve (in decimal form)
 * @param decimals - The number of decimals of the token (default: 18)
 */
export function useERC20Approval({
  tokenAddress,
  spenderAddress,
  amount,
  decimals = 18,
}: UseERC20ApprovalParams): UseERC20ApprovalReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if token is native ETH (which doesn't need approval)
  const isNativeToken = tokenAddress === NATIVE_TOKEN_ERC20_ADDRESS;

  // Convert amount to the proper format with decimals
  const amountInWei = parseUnits(amount, decimals);

  // If it's native ETH, always return as approved
  // Otherwise, check if the current allowance is sufficient
  const isApproved = isNativeToken ? true : allowance >= amountInWei;

  // Fetch the current allowance
  const fetchAllowance = async () => {
    if (!address || !tokenAddress || tokenAddress === "0x0" || !spenderAddress) {
      return;
    }

    // No need to check allowance for native token
    if (isNativeToken) {
      setAllowance(BigInt(2) ** BigInt(256) - BigInt(1)); // Max uint256 value
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      if (!publicClient) {
        throw new Error("Public client is not available");
      }

      const currentAllowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, spenderAddress],
      });

      setAllowance(currentAllowance);
    } catch (err) {
      setIsError(true);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch allowance")
      );
      console.error("Error fetching allowance:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Approve the spender to use tokens
  const approve = async () => {
    // For native token, no approval needed, just return
    if (isNativeToken) {
      return;
    }

    if (!address || !walletClient || !tokenAddress || !spenderAddress) {
      throw new Error("Missing required parameters for approval");
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, amountInWei],
      });

      // Wait for the transaction to be confirmed
      if (!publicClient) {
        throw new Error("Public client is not available");
      }
      await publicClient.waitForTransactionReceipt({ hash });

      // Refresh the allowance after approval
      await fetchAllowance();
    } catch (err) {
      setIsError(true);
      setError(
        err instanceof Error ? err : new Error("Failed to approve tokens")
      );
      console.error("Error approving tokens:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch allowance on component mount and when dependencies change
  useEffect(() => {
    if (address && tokenAddress && spenderAddress) {
      fetchAllowance();
    } else {
      // Reset states when dependencies are missing
      setIsLoading(false);
    }
  }, [address, tokenAddress, spenderAddress]);

  return {
    isApproved,
    isLoading,
    isError,
    allowance,
    approve,
    error,
  };
}
