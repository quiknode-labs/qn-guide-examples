import { NextRequest, NextResponse } from "next/server";
import { ValidatorStakingError } from "@/utils/errors";
import { createRpcConnection } from "@/utils/solana/rpc";
import { address } from "@solana/kit";
import { getStakeAccounts } from "@/utils/solana/stake/get-stake-accounts";

/**
 * Get the stake accounts for a wallet address and optionally filtered by vote account
 * @param request - The request object
 * @returns The stake accounts associated with the wallet address
 * Endpoint: /api/stake?owner=<address>&vote=<address>
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerAddress = searchParams.get("owner");
    const voteAddress = searchParams.get("vote");

    if (!ownerAddress) {
      return NextResponse.json(
        { error: "Owner address parameter is required" },
        { status: 400 }
      );
    }

    const rpc = createRpcConnection();

    const stakeAccounts = await getStakeAccounts({
      rpc,
      owner: address(ownerAddress),
      vote: voteAddress ? address(voteAddress) : undefined
    });

    return NextResponse.json({ stakeAccounts });
  } catch (error) {
    console.error("Stake accounts fetch error:", error);
    if (error instanceof ValidatorStakingError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch stake accounts" },
      { status: 500 }
    );
  }
}
