#!/usr/bin/env node
/**
 * Generate a valid PAYMENT-SIGNATURE header for testing the Rails app
 *
 * Usage:
 *   npm install viem
 *   export X402_TEST_PRIVATE_KEY="0x..."
 *   npx tsx generate_payment.ts
 *
 * Or with ts-node:
 *   npx ts-node generate_payment.ts
 */

import { createWalletClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Configuration
const PRIVATE_KEY = (process.env.X402_TEST_PRIVATE_KEY ||
  "0xYourPrivateKeyHere") as Hex;
const PORT = process.env.PORT || "3000";
const PAY_TO = (process.env.X402_WALLET_ADDRESS ||
  "0xd086Ef8F2c0F9d642120cCf0898BD101b1d18Db6") as Address;
const CHAIN =
  process.env.X402_CHAIN || process.env.X402_NETWORK || "eip155:84532";

// Create account from private key
const account = privateKeyToAccount(PRIVATE_KEY);

console.log(`Using test account: ${account.address}`);
console.log(`Port: ${PORT}`);
console.log();

// Payment requirements (matching what the Rails app expects)
const requirements = {
  scheme: "exact",
  network: CHAIN,
  asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
  pay_to: PAY_TO,
  amount: "1000", // $0.001 in atomic units
  resource: `http://localhost:${PORT}/api/weather/paywalled_info`,
  description: "Payment required for /api/weather/paywalled_info",
  max_timeout_seconds: 600,
  mime_type: "application/json",
  output_schema: null,
  extra: {
    name: "USDC",
    version: "2",
  },
};

// EIP-712 Domain for x402 payments
const domain = {
  name: "x402",
  version: "1",
  chainId: baseSepolia.id,
  verifyingContract: requirements.asset as Address,
};

// EIP-712 Types for x402 Authorization
const types = {
  Authorization: [
    { name: "payer", type: "address" },
    { name: "payee", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "bytes32" },
    { name: "validUntil", type: "uint256" },
    { name: "resource", type: "string" },
  ],
} as const;

// Generate random nonce (32 bytes)
function generateNonce(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as Hex;
}

// Calculate validUntil timestamp
const validUntil =
  Math.floor(Date.now() / 1000) + requirements.max_timeout_seconds;

// Generate nonce
const nonce = generateNonce();

// Prepare the message to sign
const message = {
  payer: account.address,
  payee: PAY_TO,
  amount: BigInt(requirements.amount),
  nonce,
  validUntil: BigInt(validUntil),
  resource: requirements.resource,
};

// Create wallet client for signing
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

// Sign the EIP-712 message
async function generatePaymentHeader() {
  try {
    const signature = await walletClient.signTypedData({
      account,
      domain,
      types,
      primaryType: "Authorization",
      message,
    });

    // Construct the PAYMENT-SIGNATURE header
    const paymentHeader = {
      version: "2",
      scheme: requirements.scheme,
      payload: {
        authorization: {
          payer: account.address,
          payee: PAY_TO,
          amount: requirements.amount,
          nonce,
          validUntil: validUntil.toString(),
          resource: requirements.resource,
          signature,
        },
        requirements: {
          network: requirements.network,
          asset: requirements.asset,
          amount: requirements.amount,
          description: requirements.description,
          max_timeout_seconds: requirements.max_timeout_seconds,
          mime_type: requirements.mime_type,
          extra: requirements.extra,
        },
      },
    };

    // Encode as base64
    const paymentHeaderJson = JSON.stringify(paymentHeader);
    const paymentHeaderBase64 =
      Buffer.from(paymentHeaderJson).toString("base64");

    console.log("\nPayment Header (PAYMENT-SIGNATURE):");
    console.log(paymentHeaderBase64);

    console.log("\n\nCurl command:");
    console.log(
      `curl -i -H "PAYMENT-SIGNATURE: ${paymentHeaderBase64}" http://localhost:${PORT}/api/weather/paywalled_info`
    );

    console.log("\n\nDecoded Payment Header (for debugging):");
    console.log(JSON.stringify(paymentHeader, null, 2));
  } catch (error) {
    console.error("Error generating payment header:", error);
    process.exit(1);
  }
}

// Run the generator
generatePaymentHeader();
