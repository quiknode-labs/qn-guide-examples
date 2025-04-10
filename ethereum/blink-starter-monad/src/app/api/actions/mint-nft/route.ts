import { ActionGetResponse, ActionPostResponse } from "@solana/actions";
import { serialize, http } from "wagmi";
import { parseEther, encodeFunctionData, createPublicClient } from "viem";
import { monad } from "@/monad";

const blockchain = "eip155:10143";
const NFT_CONTRACT_ADDRESS = "YOUR_NFT_ADDRESS"; // Input your NFT contract address
const MINT_PRICE_ETH = "YOUR_NFT_MINT_PRICE"; // Price per NFT in MON (adjust as configured by your smart contract)

const client = createPublicClient({
  chain: monad,
  transport: http(process.env.MONAD_ENDPOINT_URL),
});

async function estimateGasFees() {
  const feeData = await client.estimateFeesPerGas();
  
  if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
    throw new Error("Failed to retrieve gas fee data from the network");
  }
  
  return {
    maxFeePerGas: feeData.maxFeePerGas.toString(),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.toString(),
  };
}

const nftAbi = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" }, 
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "safeMint",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-blockchain-ids, x-action-version",
  "Access-Control-Expose-Headers": "x-blockchain-ids, x-action-version",
  "Content-Type": "application/json",
  "x-blockchain-ids": blockchain,
  "x-action-version": "2.4",
};

export const OPTIONS = async () => {
  return new Response(null, { headers });
};

export const GET = async (req: Request) => {
  const response: ActionGetResponse = {
    type: "action",
    icon: `${new URL("/nft-mint.png", req.url).toString()}`,
    label: "",
    title: "",
    description:
      `1 ProtoMON = 0.0069420 MON`,
    links: {
      actions: [
        {
          type: "transaction",
          href: `/api/actions/mint-nft?amount={amount}`,
          label: "Mint NFT",
          parameters: [
            {
              name: "amount",
              label: `Enter MON amount in wei`,
              type: "number",
            },
          ],
        }
      ],
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers,
  });
};

export const POST = async (req: Request) => {
  try {
    const requestBody = await req.json();
    const userAddress = requestBody.account;
    
    const url = new URL(req.url);
    const monAmount = url.searchParams.get("amount");
    
    if (!userAddress) {
      throw new Error("User address is required");
    }
    
    if (!monAmount) {
      throw new Error("MON amount is required");
    }
    
    const monValue = parseFloat(monAmount.replace(',', '.'));
    
    if (isNaN(monValue) || monValue <= 0) {
      throw new Error(`Invalid MON amount: ${monAmount}`);
    }
    
    const pricePerNFT = parseFloat(MINT_PRICE_ETH);
    const numNFTs = Math.floor(monValue / pricePerNFT);
    
    if (numNFTs < 1) {
      throw new Error(`Amount too small. Minimum is ${MINT_PRICE_ETH} MON for 1 NFT.`);
    }
    
    const actualMonAmount = (numNFTs * pricePerNFT).toFixed(8);
    console.log(`User entered ${monValue} MON, buying ${numNFTs} NFTs for ${actualMonAmount} MON`);
    
    const weiValue = parseEther(actualMonAmount);
    
    const data = encodeFunctionData({
      abi: nftAbi,
      functionName: "safeMint",
      args: [userAddress, BigInt(numNFTs)],
    });

    const gasEstimate = await estimateGasFees();
    
    const transaction = {
      to: NFT_CONTRACT_ADDRESS,
      data,
      value: weiValue.toString(),
      chainId: "10143", // Monad testnet
      type: "0x2",
      maxFeePerGas: gasEstimate.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
    };

    const transactionJson = serialize(transaction);

    const response: ActionPostResponse = {
      type: "transaction",
      transaction: transactionJson,
      message: `Minting ${numNFTs} NFT${numNFTs > 1 ? 's' : ''} for ${actualMonAmount} MON!`,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ 
      error: "Error processing request", 
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 400,
      headers,
    });
  }
};