"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Droplets, Info, Shield, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount, useReadContract } from "wagmi";
import { USDC_CONTRACT_ADDRESS, USDC_DECIMALS } from "@/lib/constants";
import { requestDrip } from "@/lib/x402";
import { StatusDot } from "./status-dot";

type WalletPanelProps = {
  jwt: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  accountId: string | null;
  expiresAt: Date | null;
  onAuthenticate: () => Promise<void>;
};

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletPanel({
  jwt,
  isAuthenticated,
  isAuthenticating,
  authError,
  accountId,
  expiresAt,
  onAuthenticate,
}: WalletPanelProps) {
  const { address, isConnected } = useAccount();
  const [isDripping, setIsDripping] = useState(false);
  const [dripError, setDripError] = useState<string | null>(null);
  const [dripTxHash, setDripTxHash] = useState<string | null>(null);

  // Clear faucet state when wallet address changes
  useEffect(() => {
    setDripTxHash(null);
    setDripError(null);
  }, [address]);

  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!address },
  });

  const handleDrip = useCallback(async () => {
    if (!jwt) return;
    setIsDripping(true);
    setDripError(null);
    try {
      const result = await requestDrip(jwt);
      setDripTxHash(result.transactionHash);
      setTimeout(() => void refetchBalance(), 5000);
    } catch (error) {
      setDripError(error instanceof Error ? error.message : "Faucet request failed.");
    } finally {
      setIsDripping(false);
    }
  }, [jwt, refetchBalance]);

  if (!isConnected) return null;

  const formattedBalance =
    usdcBalance !== undefined ? formatUnits(usdcBalance, USDC_DECIMALS) : "—";

  return (
    <Card variant="white">
      <Card.Content className="p-4 gap-3 lg:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-(--foreground-light) uppercase">
              Wallet
            </span>
            {isAuthenticated ? (
              <StatusDot variant="active" label="Authenticated" />
            ) : (
              <StatusDot variant="inactive" label="Not authenticated" />
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-md border border-(--border) px-3 py-2">
              <Wallet className="h-3.5 w-3.5 shrink-0 text-(--foreground-light)" />
              <span className="font-mono text-base text-(--foreground)">
                {address ? truncateAddress(address) : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-(--border) px-3 py-2">
              <Droplets className="h-3.5 w-3.5 shrink-0 text-(--foreground-light)" />
              <span className="font-mono text-base text-(--foreground)">
                {formattedBalance} USDC
              </span>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-md bg-(--border) px-3 py-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--foreground-medium)" />
                <p className="text-sm text-(--foreground-medium) leading-relaxed">
                  Signing authenticates you via{" "}
                  <a
                    href="https://login.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Sign-In with Ethereum (SIWE)
                  </a>
                  . No tokens are spent — it only proves wallet ownership to get a
                  session token for API access.
                </p>
              </div>
              <Button
                onClick={onAuthenticate}
                disabled={isAuthenticating}
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {isAuthenticating ? "Signing..." : "Authenticate with SIWE"}
                </span>
              </Button>
            </div>
          )}

          {isAuthenticated && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleDrip}
                disabled={isDripping}
              >
                <span className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  {isDripping ? "Requesting..." : "Get Testnet USDC"}
                </span>
              </Button>
              {accountId && (
                <span className="text-sm text-(--foreground-light)">
                  {accountId}
                </span>
              )}
            </div>
          )}

          {authError && (
            <p className="truncate text-sm text-red-600" title={authError}>
              {authError.length > 120
                ? `${authError.slice(0, 120)}...`
                : authError}
            </p>
          )}

          {dripError && (
            <p className="text-sm text-red-600">
              {dripError}
              {dripError.includes("already") && (
                <span className="block mt-1 text-sm text-(--foreground-light)">
                  Try{" "}
                  <a
                    href="https://faucet.circle.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    faucet.circle.com
                  </a>{" "}
                  for additional testnet USDC.
                </span>
              )}
            </p>
          )}

          {dripTxHash && (
            <p className="text-sm text-(--foreground-light)">
              Faucet tx:{" "}
              <a
                href={`https://sepolia.basescan.org/tx/${dripTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {truncateAddress(dripTxHash)}
              </a>
            </p>
          )}

          {isAuthenticated && expiresAt && (
            <p className="text-sm text-(--foreground-light)">
              Session expires: {expiresAt.toLocaleTimeString()}
            </p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
