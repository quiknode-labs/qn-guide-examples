import { Commitment, signature } from "@solana/kit";
import { createRpcConnection } from "./rpc";
import { ValidatorStakingError } from "../errors";

interface TransactionStatus {
  txid: string;
  targetCommitment: Commitment;
  timeout: number;
  interval: number;
}

function isCommitmentMet(achieved: Commitment, target: Commitment): boolean {
  const levels: { [key in Commitment]: number } = {
    processed: 1,
    confirmed: 2,
    finalized: 3
  };
  return levels[achieved] >= levels[target];
}

export async function confirmTransaction({
  txid,
  targetCommitment = "confirmed",
  timeout = 30000,
  interval = 3000
}: TransactionStatus) {
  const rpc = createRpcConnection();
  const startTime = Date.now();
  const endTime = startTime + timeout;
  while (Date.now() < endTime) {
    const transaction = await rpc
      .getSignatureStatuses([signature(txid)])
      .send();
    const status = transaction.value?.[0]?.confirmationStatus;
    if (status && isCommitmentMet(status as Commitment, targetCommitment)) {
      return;
    }
    if (transaction.value?.[0]?.err) {
      throw new ValidatorStakingError(
        "Transaction failed",
        "TRANSACTION_FAILED"
      );
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new ValidatorStakingError(
    "Transaction confirmation timed out",
    "CONFIRMATION_TIMEOUT"
  );
}
