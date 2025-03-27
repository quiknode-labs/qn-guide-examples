import { Code, Flex, Text } from "@radix-ui/themes";
import {
  isWalletStandardError,
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED,
  WALLET_STANDARD_ERROR__FEATURES__WALLET_FEATURE_UNIMPLEMENTED
} from "@wallet-standard/core";
import React from "react";

export const NO_ERROR = Symbol();

export class ValidatorStakingError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = "ValidatorStakingError";
  }
}

// Custom error factory functions for common staking scenarios
export const createStakingError = {
  insufficientBalance: (required: string, actual: string) =>
    new ValidatorStakingError(
      `Insufficient balance for staking. Required: ${required}, Available: ${actual}`,
      "INSUFFICIENT_BALANCE",
      { required, actual }
    ),

  invalidValidator: (address: string) =>
    new ValidatorStakingError(
      `Invalid validator address: ${address}`,
      "INVALID_VALIDATOR",
      { address }
    ),

  stakingFailed: (reason: string) =>
    new ValidatorStakingError(
      `Staking operation failed: ${reason}`,
      "STAKING_FAILED",
      { reason }
    ),

  unstakingLocked: (unlockTime: Date) =>
    new ValidatorStakingError(
      `Tokens are still in the unstaking period. Available at: ${unlockTime.toISOString()}`,
      "UNSTAKING_LOCKED",
      { unlockTime }
    )
};

export function getErrorMessage(
  err: unknown,
  fallbackMessage: React.ReactNode
): React.ReactNode {
  if (err instanceof ValidatorStakingError) {
    return (
      <Flex direction="column" gap="2">
        <Text as="p" color="red">
          {err.message}
        </Text>
        {err.code && (
          <Text as="p" size="2" color="gray">
            Error Code: <Code>{err.code}</Code>
          </Text>
        )}
      </Flex>
    );
  } else if (
    isWalletStandardError(
      err,
      WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED
    )
  ) {
    return (
      <>
        This account does not support the <Code>{err.context.featureName}</Code>{" "}
        feature
      </>
    );
  } else if (
    isWalletStandardError(
      err,
      WALLET_STANDARD_ERROR__FEATURES__WALLET_FEATURE_UNIMPLEMENTED
    )
  ) {
    return (
      <Flex direction="column" gap="4">
        <Text as="p">
          The wallet '{err.context.walletName}' (
          {err.context.supportedChains.sort().map((chain, ii, { length }) => (
            <React.Fragment key={chain}>
              <Code>{chain}</Code>
              {ii === length - 1 ? null : ", "}
            </React.Fragment>
          ))}
          ) does not support the <Code>{err.context.featureName}</Code> feature.
        </Text>
        <Text as="p" trim="end">
          Features supported:
          <ul>
            {err.context.supportedFeatures.sort().map((featureName) => (
              <li key={featureName}>
                <Code>{featureName}</Code>
              </li>
            ))}
          </ul>
        </Text>
      </Flex>
    );
  } else if (
    isWalletStandardError(
      err,
      WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED
    )
  ) {
    return (
      <Flex direction="column" gap="4">
        <Text as="p">
          This account does not support the chain{" "}
          <Code>{err.context.chain}</Code>.
        </Text>
        <Text as="p" trim="end">
          Chains supported:
          <ul>
            {err.context.supportedChains.sort().map((chain) => (
              <li key={chain}>
                <Code>{chain}</Code>
              </li>
            ))}
          </ul>
        </Text>
      </Flex>
    );
  } else if (err && typeof err === "object" && "message" in err) {
    return String(err.message);
  }
  return fallbackMessage;
}
