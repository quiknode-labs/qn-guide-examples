import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import contractData from "@/lib/RiskBasedStaking";

// Set environment variable to force JS implementation before importing
process.env.UWS_NO_NATIVE = '1';

import {
  SecretsManager,
  simulateScript,
  ResponseListener,
  ReturnType,
  decodeResult,
  DecodedResult,
} from "@chainlink/functions-toolkit";

const abi = contractData.abi;
const consumerAddress = process.env.CONTRACT_ADDRESS || "";
const subscriptionId = parseInt(process.env.SUBSCRIPTION_ID || "0");

async function makeRiskScoreRequest(
  userAddress: string
): Promise<string | null> {
  // Chainlink Functions configuration
  const routerAddress = "0xf9B8fc078197181C841c296C876945aaa425B278";
  const donId = "fun-base-mainnet-1";
  const gatewayUrls = [
    "https://01.functions-gateway.chain.link/",
    "https://02.functions-gateway.chain.link/",
  ];

  // Get the JavaScript source code
  const source = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "api", "check-risk", "source.js"),
    "utf8"
  );
  const args = [userAddress];
  const quicknodeEndpoint = process.env.QUICKNODE_ENDPOINT;
  if (!quicknodeEndpoint) {
    throw new Error("QUICKNODE_ENDPOINT is not defined");
  }
  const secrets = { QUICKNODE_ENDPOINT: quicknodeEndpoint };

  // Configuration
  const slotIdNumber = 0;
  const expirationTimeMinutes = 15;
  const gasLimit = 300000;
  const privateKey = process.env.PRIVATE_KEY || "";

  // Set up provider and signer
  const provider = new ethers.providers.JsonRpcProvider({
    skipFetchSetup: true,
    url: quicknodeEndpoint,
  });

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);

  let simulationResult: DecodedResult | null = null;

  // Make uncomment if you want to simulate the script prior to sending the request
  // console.log("Starting simulation...");

  // try {
  //   const simulation = await simulateScript({
  //     source,
  //     args,
  //     bytesArgs: [],
  //     secrets,
  //   });

  //   if (simulation.errorString) {
  //     console.log(`Simulation error: ${simulation.errorString}`);
  //   } else if (simulation.responseBytesHexstring) {
  //     simulationResult = decodeResult(
  //       simulation.responseBytesHexstring,
  //       ReturnType.uint256
  //     );
  //     console.log(`Simulation result: ${simulationResult}`);
  //   }
  // } catch (error) {
  //   console.error("Simulation failed:", error);
  // }

  // Actual request to Chainlink Functions
  try {
    // Set up the secrets manager
    const secretsManager = new SecretsManager({
      signer,
      functionsRouterAddress: routerAddress,
      donId,
    });

    await secretsManager.initialize();
    const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

    const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
      encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
      gatewayUrls,
      slotId: slotIdNumber,
      minutesUntilExpiration: expirationTimeMinutes,
    });

    if (!uploadResult.success) {
      throw new Error("Failed to upload secrets");
    }

    const donHostedSecretsVersion = uploadResult.version;

    // Send the request
    if (!consumerAddress) {
      throw new Error("CONTRACT_ADDRESS is not defined");
    }
    const consumer = new ethers.Contract(consumerAddress, abi, signer);

    const tx = await consumer.sendRequest(
      source,
      "0x",
      slotIdNumber,
      donHostedSecretsVersion,
      args,
      [],
      subscriptionId,
      gasLimit,
      ethers.utils.formatBytes32String(donId)
    );

    console.log(`Request sent! Transaction hash: ${tx.hash}`);

    // Wait for the response
    const responseListener = new ResponseListener({
      provider,
      functionsRouterAddress: routerAddress,
    });

    const response = await responseListener.listenForResponseFromTransaction(
      tx.hash
    );

    if (response.errorString) {
      // If there's an error in the Chainlink response, throw it to be caught by the handler
      throw new Error(`Chainlink Functions error: ${response.errorString}`);
    }

    if (
      response.responseBytesHexstring &&
      ethers.utils.arrayify(response.responseBytesHexstring).length > 0
    ) {
      const result = decodeResult(
        response.responseBytesHexstring,
        ReturnType.uint256
      );
      console.log(`Final result: ${result}`);
      return result?.toString() || null;
    }

    throw new Error("No valid response received from Chainlink Functions");
  } catch (error) {
    console.error("Request failed:", error);
    throw error; // Rethrow the error to be handled by the POST handler
  }
}

// API route handler
export async function POST(request: NextRequest) {
  let userAddress: string | undefined;
  try {
    const body = await request.json();
    userAddress = body.userAddress;

    if (!userAddress || typeof userAddress !== "string") {
      return NextResponse.json(
        { error: "Valid user address is required" },
        { status: 400 }
      );
    }

    console.log(`Processing risk assessment for: ${userAddress}`);
    const riskScore = await makeRiskScoreRequest(userAddress);

    if (riskScore === null) {
      return NextResponse.json(
        {
          success: false,
          address: userAddress,
          error: "Failed to retrieve risk score",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      address: userAddress,
      riskScore: riskScore,
      message: "Risk assessment completed successfully",
    });
  } catch (error: any) {
    console.error("API Error:", error);

    // Check if the error is related to the user input (e.g., invalid wallet address)
    if (error.message.includes("was not found in blockchain")) {
      return NextResponse.json(
        {
          success: false,
          address: userAddress,
          error: "Invalid wallet address: not found on blockchain",
          errorCode: "INVALID_ADDRESS", // Added errorCode
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process risk assessment: " + error.message,
        errorCode: "SERVER_ERROR", // Added errorCode
      },
      { status: 500 }
    );
  }
}
