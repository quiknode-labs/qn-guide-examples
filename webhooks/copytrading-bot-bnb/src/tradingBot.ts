import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  type Address,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { config } from "./config";

// Contract ABI for buyTokenAMAP function
const TRADING_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "origin", type: "uint256" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "funds", type: "uint256" },
      { internalType: "uint256", name: "minAmount", type: "uint256" },
    ],
    name: "buyTokenAMAP",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

// Initialize Viem clients
const account = privateKeyToAccount(config.privateKey);

const client = createWalletClient({
  account,
  chain: bsc,
  transport: http(config.rpcUrl),
}).extend(publicActions)



console.log(`🔑 Trading wallet: ${account.address}`);

// Trade data interface
interface TradeData {
  token: Address;
  buyer: Address;
  price: string;
  amount: string;
  cost: string;
  fee: string;
  offers: string;
  funds: string;
}

interface CopyTradePayload {
  transactionHash: string;
  blockNumber: string;
  blockTimestamp: number;
  buyer: string;
  logs: TradeData[];
}

/**
 * Execute copy trade based on whale's purchase
 */
export async function executeCopyTrade(
  payload: CopyTradePayload
): Promise<void> {
  try {
    const tradeData = payload.logs[0]; // First log entry
    const whaleCostBNB = parseFloat(formatEther(BigInt(tradeData.cost)));
    const whaleFee = parseFloat(formatEther(BigInt(tradeData.fee)));

    console.log("\n📊 Whale Trade Detected:");
    console.log(`├─ Token: ${tradeData.token}`);
    console.log(`├─ Whale: ${tradeData.buyer}`);
    console.log(`├─ Amount: ${formatEther(BigInt(tradeData.amount))} tokens`);
    console.log(`├─ Cost: ${whaleCostBNB.toFixed(6)} BNB`);
    console.log(`├─ Fee: ${whaleFee.toFixed(6)} BNB`);
    console.log(`├─ Total Spent: ${(whaleCostBNB + whaleFee).toFixed(6)} BNB`);
    console.log(`└─ TX: ${payload.transactionHash}`);

    // Strategy: Only copy if whale buys significantly
    if (whaleCostBNB < config.minCopyTradeAmount) {
      console.log(
        `⏭️  Skipping - Trade too small (< ${config.minCopyTradeAmount} BNB)`
      );
      return;
    }

    // Calculate our trade amount (e.g., 10% of whale's trade)
    let ourTradeAmount = whaleCostBNB * config.copyTradeMultiplier;

    // Apply safety limits
    if (ourTradeAmount > config.maxTradeAmount) {
      console.log(
        `⚠️  Capping trade at max limit: ${config.maxTradeAmount} BNB`
      );
      ourTradeAmount = config.maxTradeAmount;
    }

    // Check wallet balance
    const balance = await client.getBalance({ address: account.address });
    const balanceBNB = parseFloat(formatEther(balance));

    console.log(`\n💰 Wallet Balance: ${balanceBNB.toFixed(6)} BNB`);

    if (balanceBNB < ourTradeAmount + config.minBalance) {
      console.log(
        `❌ Insufficient balance (need ${
          ourTradeAmount + config.minBalance
        } BNB including reserve)`
      );
      return;
    }

    // Calculate minAmount with slippage tolerance
    // Estimate expected tokens based on whale's rate
    const expectedAmount =
      (BigInt(tradeData.amount) * parseEther(ourTradeAmount.toString())) /
      BigInt(tradeData.cost);
    const minAmount =
      (expectedAmount * BigInt(100 - config.slippageTolerance)) / BigInt(100);

    console.log(`\n🎯 Executing Copy Trade:`);
    console.log(`├─ Our Amount: ${ourTradeAmount.toFixed(6)} BNB`);
    console.log(`├─ Expected Tokens: ${formatEther(expectedAmount)}`);
    console.log(`├─ Min Tokens: ${formatEther(minAmount)}`);
    console.log(`└─ Slippage: ${config.slippageTolerance}%`);

    console.log("\n⏳ Sending transaction...");

    // Execute the trade
    const { request } = await client.simulateContract({
      account: account,
      address: config.contractAddress,
      abi: TRADING_ABI,
      functionName: "buyTokenAMAP",
      args: [
        BigInt(0), // origin
        tradeData.token, // token address
        parseEther(ourTradeAmount.toString()), // BNB amount in wei
        minAmount, // minimum tokens to receive
      ],
      value: parseEther(ourTradeAmount.toString()),
    });


    const txHash = await client.writeContract(request);

    console.log(`✅ Transaction sent: ${txHash}`);
    console.log(`🔍 View on BscScan: https://bscscan.com/tx/${txHash}`);

    // Wait for confirmation
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
    });

    if (receipt.status === "success") {
      console.log(`✅ Copy trade successful! Block: ${receipt.blockNumber}`);
    } else {
      console.log(`❌ Transaction failed`);
    }
  } catch (error: any) {
    console.error("\n❌ Error executing copy trade:");
    console.error(error);
  }
}

/**
 * Get current wallet balance
 */
export async function getWalletBalance(): Promise<string> {
  const balance = await client.getBalance({ address: account.address });
  return formatEther(balance);
}
