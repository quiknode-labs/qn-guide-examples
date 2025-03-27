import { NextRequest, NextResponse } from "next/server";
import { getBalance } from "@/utils/solana/balance";
import { ValidatorStakingError } from "@/utils/errors";
import { createRpcConnection } from "@/utils/solana/rpc";
import { address } from "@solana/kit";
import { LAMPORTS_PER_SOL } from "@/utils/constants";

/**
 * Get the balance of a wallet address
 * @param request - The request object
 * @returns The balance of the wallet address
 * Endpoint: /api/balance?address=<address>
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("address");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    const rpc = createRpcConnection();

    const lamports = await getBalance({
      rpc,
      address: address(walletAddress)
    });

    const solBigInt = Number(lamports) / LAMPORTS_PER_SOL;
    const solBalance = Number(solBigInt);
    return NextResponse.json({ solBalance });
  } catch (error) {
    console.error("Balance fetch error:", error);
    if (error instanceof ValidatorStakingError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
