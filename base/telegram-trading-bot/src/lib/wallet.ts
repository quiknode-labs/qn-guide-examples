import {
  createWalletClient,
  http,
  createPublicClient,
  Account,
  WalletClient,
  Address,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { encrypt, decrypt } from "./encryption";
import { saveWallet, getWalletByUserId } from "./database";
import {
  WalletData,
  TransactionParams,
  WithdrawalParams,
  TransactionReceipt,
} from "../types/wallet";
import { QUICKNODE_RPC_URL } from "../utils/constants";

/**
 * Create a wallet client for the given private key
 */
function createClient(account: Account): WalletClient {
  return createWalletClient({
    account,
    chain: base,
    transport: http(QUICKNODE_RPC_URL),
  });
}

/**
 * Create a public client for Base network
 */
export function createPublicClientForBase() {
  return createPublicClient({
    chain: base,
    transport: http(QUICKNODE_RPC_URL),
  });
}

/**
 * Generate a new wallet
 */
export async function generateWallet(userId: string): Promise<WalletData> {
  const privateKey = generatePrivateKey();

  // Create account from private key
  const account = privateKeyToAccount(privateKey);

  const walletData: WalletData = {
    address: account.address,
    encryptedPrivateKey: encrypt(privateKey),
    type: "generated",
    createdAt: Date.now(),
  };

  // Save wallet to database
  saveWallet(walletData, userId);

  return walletData;
}

/**
 * Import a wallet from private key
 */
export async function importWallet(
  userId: string,
  privateKey: string
): Promise<WalletData> {
  // Remove 0x prefix if present
  const cleanPrivateKey = privateKey.replace(/^0x/, "");

  // Create account from private key
  const account = privateKeyToAccount(`0x${cleanPrivateKey}`);

  const walletData: WalletData = {
    address: account.address,
    encryptedPrivateKey: encrypt(cleanPrivateKey),
    type: "imported",
    createdAt: Date.now(),
  };

  // Save wallet to database
  saveWallet(walletData, userId);

  return walletData;
}

/**
 * Get wallet for a user
 */
export async function getWallet(userId: string): Promise<WalletData | null> {
  return getWalletByUserId(userId);
}

/**
 * Get account object from wallet data
 */
export function getAccount(walletData: WalletData): Account {
  const privateKey = decrypt(walletData.encryptedPrivateKey);
  return privateKeyToAccount(`0x${privateKey.replace(/^0x/, "")}`);
}

/**
 * Get private key from wallet data
 */
export function getPrivateKey(walletData: WalletData): string {
  return decrypt(walletData.encryptedPrivateKey);
}

/**
 * Get ETH balance for an address
 */
export async function getEthBalance(address: Address): Promise<string> {
  const publicClient = createPublicClientForBase();
  const balance = await publicClient.getBalance({ address });
  return balance.toString();
}

/**
 * Execute a contract method using viem's writeContract
 */
export async function executeContractMethod({
  walletData,
  contractAddress,
  abi,
  functionName,
  args,
}: {
  walletData: WalletData;
  contractAddress: Address;
  abi: any;
  functionName: string;
  args: any[];
}): Promise<TransactionReceipt> {
  try {
    const account = getAccount(walletData);

    const publicClient = createPublicClientForBase(); // Read client
    const walletClient = createClient(account); // Write client

    // Simulate to get the transaction request
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName,
      args,
      account,
    });

    // Write transaction
    const hash = await walletClient.writeContract(request);

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === "success" ? "success" : "failure",
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error("Contract method execution failed:", error);
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function executeTransaction(
  walletData: WalletData,
  params: TransactionParams
): Promise<TransactionReceipt> {
  try {
    const account = getAccount(walletData);
    const client = createClient(account);

    // Prepare transaction parameters
    const txParams: any = {
      to: params.to,
      data: params.data,
      value: BigInt(params.value || "0"),
      gasPrice: BigInt(params.gasPrice),
    };

    // Send transaction
    const hash = await client.sendTransaction(txParams);

    // Wait for transaction receipt
    const publicClient = createPublicClientForBase();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === "success" ? "success" : "failure",
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error("Transaction execution failed:", error);
    throw error;
  }
}

/**
 * Withdraw ETH to another address
 */
export async function withdrawEth(
  walletData: WalletData,
  params: WithdrawalParams
): Promise<TransactionReceipt> {
  try {
    const account = getAccount(walletData);

    const client = createClient(account);

    // Prepare transaction parameters
    const txParams: any = {
      to: params.to,
      value: BigInt(params.amount),
      gasLimit: BigInt(21000), // Standard gas limit for ETH transfer
    };

    // Add gas price parameters
    if (params.maxFeePerGas && params.maxPriorityFeePerGas) {
      txParams.maxFeePerGas = BigInt(params.maxFeePerGas);
      txParams.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
    } else if (params.gasPrice) {
      txParams.gasPrice = BigInt(params.gasPrice);
    }

    // Send transaction
    const hash = await client.sendTransaction(txParams);

    // Wait for transaction receipt
    const publicClient = createPublicClientForBase();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === "success" ? "success" : "failure",
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error("Withdrawal failed:", error);
    throw error;
  }
}

/**
 * Estimate gas for ETH withdrawal
 */
export async function estimateWithdrawalGas(
  from: Address,
  to: Address,
  amount: string
): Promise<string> {
  try {
    const publicClient = createPublicClientForBase();

    const gasEstimate = await publicClient.estimateGas({
      account: from,
      to: to,
      value: BigInt(amount),
    });

    return gasEstimate.toString();
  } catch (error) {
    console.error("Gas estimation failed:", error);
    return "21000"; // Default gas limit for ETH transfer
  }
}
