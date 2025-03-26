import {
  Lamports,
  Rpc,
  stringifiedBigInt,
  StringifiedBigInt
} from "@solana/kit";
import { SolanaRpcApi } from "@solana/kit";
import { Address } from "@solana/kit";

interface GetBalanceProps {
  rpc: Rpc<SolanaRpcApi>;
  address: Address;
}

export async function getBalance({
  rpc,
  address
}: GetBalanceProps): Promise<Lamports> {
  const { value } = await rpc.getBalance(address).send();
  return value;
}
