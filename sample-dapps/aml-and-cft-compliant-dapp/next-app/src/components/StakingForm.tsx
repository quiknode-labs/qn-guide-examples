"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Container,
  Box,
  Button,
  Card,
  Flex,
  Progress,
  Notification,
  NumberInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { formatEther } from "viem";
import { useStakingContract } from "../hooks/useStakingContract";
import { useRiskCheck } from "../hooks/useRiskCheck";

// Define the RiskCheckResult interface (move this to a shared types file if needed)
interface RiskCheckResult {
  riskScore: bigint | null;
  errorCode?: string;
  errorMessage?: string;
}

export function StakingForm() {
  const { address, isConnected } = useAccount();
  const {
    stakedBalance,
    riskScore,
    riskThreshold,
    isPending,
    canStake,
    isStaking,
    isWithdrawing,
    stake,
    withdraw,
    refetch: refetchStakingData,
  } = useStakingContract();

  const {
    checkRiskScore,
    isLoading: isCheckingApi,
    error: apiError,
  } = useRiskCheck();

  const [stakeAmount, setStakeAmount] = useState<string | undefined>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string | undefined>("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
    errorCode?: string;
  } | null>(null);

  // Refetch data after actions or periodically
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (address) {
      // Initial fetch on mount or address change
      refetchStakingData();

      // Poll every 10 seconds to catch updates (e.g., risk score from Chainlink)
      interval = setInterval(() => {
        refetchStakingData();
      }, 10000); // Adjust polling interval as needed
    }

    return () => {
      if (interval) clearInterval(interval); // Cleanup on unmount
    };
  }, [address, refetchStakingData]);

  // Handle risk check
  const handleCheckRisk = async () => {
    if (!address) return;

    try {
      setNotification(null);
      const result: RiskCheckResult = await checkRiskScore(address);

      if (result.riskScore !== null) {
        setNotification({
          message: "Risk assessment completed successfully! Updating soon...",
          type: "success",
        });
        await refetchStakingData();
      } else {
        // Display error with code and message
        setNotification({
          message: result.errorMessage || "Error checking risk score.",
          type: "error",
          errorCode: result.errorCode,
        });
      }
    } catch (error) {
      console.error("Error checking risk:", error);
      setNotification({
        message: "Error checking risk score. Please try again.",
        type: "error",
        errorCode: "UNKNOWN_ERROR",
      });
    }
  };

  // Handle staking
  const handleStake = async (amount: string) => {
    try {
      setNotification(null);
      await stake(amount);
      setNotification({
        message: `Successfully staked ${amount} ETH`,
        type: "success",
      });
      setStakeAmount(""); // Clear input
      await refetchStakingData(); // Update balance
    } catch (error) {
      console.error("Staking error:", error);
      setNotification({
        message: "Staking failed. Please try again.",
        type: "error",
      });
    }
  };

  // Handle withdrawal
  const handleWithdraw = async (amount: string) => {
    try {
      setNotification(null);
      await withdraw(amount);
      setNotification({
        message: `Successfully withdrew ${amount} ETH`,
        type: "success",
      });
      setWithdrawAmount(""); // Clear input
      await refetchStakingData(); // Update balance
    } catch (error) {
      console.error("Withdrawal error:", error);
      setNotification({
        message: "Withdrawal failed. Please try again.",
        type: "error",
      });
    }
  };

  if (!isConnected) {
    return (
      <Container size="md" my={50}>
        <Card withBorder p="xl" radius="md" className="card" ta="center">
          <Title order={3} mb="lg">
            Welcome to Risk-Based Staking
          </Title>
          <Text mb="xl" c="dimmed">
            Please connect your wallet to continue
          </Text>
        </Card>
      </Container>
    );
  }

  const hasRiskScore = riskScore && Number(riskScore) > 0;
  const formattedBalance =
    stakedBalance && typeof stakedBalance === "string"
      ? formatEther(BigInt(stakedBalance))
      : "0";
  const riskScoreValue = riskScore ? Number(riskScore) : 0;

  return (
    <Container size="md" my={50}>
      {notification && (
        <Notification
          color={notification.type === "success" ? "green" : "red"}
          onClose={() => setNotification(null)}
          withCloseButton
          mb="lg"
        >
          {notification.message}
          {notification.errorCode && (
            <Text size="sm" mt="xs" c="dimmed">
              Error Code: {notification.errorCode}
            </Text>
          )}
        </Notification>
      )}

      <Card withBorder p="xl" radius="md" className="card">
        <Stack gap="xl">
          <Title order={3} c="blue.8">
            Stake ETH Securely
          </Title>

          {/* Risk Score Section */}
          <Card withBorder p="xl" radius="md" className="section-card">
            <Stack gap="md">
              <Title order={4}>Wallet Risk Assessment</Title>

              {hasRiskScore ? (
                <Box>
                  <Flex justify="space-between" align="center" mb="xs">
                    <Text fw={500}>Your Risk Score:</Text>
                    <Text fw={700} size="lg" c={canStake ? "green.6" : "red.6"}>
                      {riskScoreValue}/100
                    </Text>
                  </Flex>

                  <Progress
                    value={riskScoreValue}
                    color={canStake ? "green.6" : "red.6"}
                    size="lg"
                    mb="md"
                    radius="xl"
                  />

                  <Flex justify="space-between" mb="md">
                    <Text size="sm" c="dimmed">
                      High Risk
                    </Text>
                    <Text size="sm" c="dimmed">
                      Low Risk
                    </Text>
                  </Flex>

                  <Text size="sm" c="dimmed" mb="md">
                    Minimum Score Threshold: {Number(riskThreshold)}
                  </Text>

                  <Text
                    fw={600}
                    c={canStake ? "green.6" : "red.6"}
                    ta="center"
                    mb="lg"
                  >
                    {canStake
                      ? "✅ Your wallet is eligible to stake"
                      : "❌ Your wallet does not meet the minimum safety threshold"}
                  </Text>

                  <Button
                    variant="outline"
                    onClick={handleCheckRisk}
                    loading={isCheckingApi || Boolean(isPending)}
                    disabled={Boolean(isPending)}
                    fullWidth
                  >
                    {isPending ? "Check Pending..." : "Re-check Risk Score"}
                  </Button>
                </Box>
              ) : (
                <Flex direction="column" align="center" py="xl">
                  <Text mb="lg" ta="center">
                    Before staking, we need to verify your wallet&apos;s risk
                    profile. This helps ensure the security of our staking pool.
                  </Text>
                  <Button
                    onClick={handleCheckRisk}
                    loading={isCheckingApi || Boolean(isPending)}
                    disabled={Boolean(isPending)}
                    size="lg"
                    radius="md"
                  >
                    {isPending
                      ? "Check Pending..."
                      : "Check My Wallet Risk Score"}
                  </Button>
                </Flex>
              )}
            </Stack>
          </Card>

          {/* Staking Section */}
          <Card withBorder p="xl" radius="md" className="section-card">
            <Stack gap="md">
              <Flex justify="space-between" align="center">
                <Title order={4}>Staking Dashboard</Title>
                <Text fw={700} size="lg">
                  Balance: {formattedBalance} ETH
                </Text>
              </Flex>

              <Flex gap="xl" wrap="wrap">
                {/* Stake Form */}
                <Box style={{ flexGrow: 1, minWidth: "45%" }}>
                  <Card withBorder radius="md" p="md" bg="gray.0">
                    <Text fw={600} size="lg" mb="md">
                      Stake ETH
                    </Text>
                    <Stack>
                      <NumberInput
                        value={stakeAmount}
                        onChange={(value) => setStakeAmount(value?.toString())}
                        placeholder="Amount in ETH"
                        min={0}
                        step={0.01}
                        disabled={!canStake || isStaking}
                        size="md"
                        radius="md"
                      />
                      <Button
                        onClick={() => handleStake(stakeAmount || "0")}
                        disabled={!canStake || !stakeAmount || isStaking}
                        loading={isStaking}
                        fullWidth
                        size="lg"
                      >
                        Stake Now
                      </Button>
                    </Stack>
                  </Card>
                </Box>

                {/* Withdraw Form */}
                <Box style={{ flexGrow: 1, minWidth: "45%" }}>
                  <Card withBorder radius="md" p="md" bg="gray.0">
                    <Text fw={600} size="lg" mb="md">
                      Withdraw ETH
                    </Text>
                    <Stack>
                      <NumberInput
                        value={withdrawAmount}
                        onChange={(value) =>
                          setWithdrawAmount(value?.toString())
                        }
                        placeholder="Amount in ETH"
                        min={0}
                        max={Number(formattedBalance)}
                        step={0.01}
                        disabled={!Number(stakedBalance) || isWithdrawing}
                        size="md"
                        radius="md"
                      />
                      <Button
                        onClick={() => handleWithdraw(withdrawAmount || "0")}
                        disabled={
                          !Number(stakedBalance) ||
                          !withdrawAmount ||
                          isWithdrawing
                        }
                        loading={isWithdrawing}
                        variant="outline"
                        fullWidth
                        size="lg"
                      >
                        Withdraw
                      </Button>
                    </Stack>
                  </Card>
                </Box>
              </Flex>
            </Stack>
          </Card>
        </Stack>
      </Card>
    </Container>
  );
}
