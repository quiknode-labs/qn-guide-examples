import {
  createKeyPairFromBytes,
  getAddressFromPublicKey,
  getAddressDecoder,
  address,
  sendTransactionWithoutConfirmingFactory,
  assertIsTransactionWithinSizeLimit,
  getTransactionDecoder,
  signTransaction,
  getSignatureFromTransaction,
} from '@solana/kit';
import type { createSolanaRpc } from '@solana/kit';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { OrderResponse, OrderStatusResponse } from './types';

type SolanaRpc = ReturnType<typeof createSolanaRpc>;

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function getHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = process.env.DFLOW_API_KEY;
  if (apiKey) h['x-api-key'] = apiKey;
  return h;
}

export async function loadWallet() {
  const keypairPath = process.env.KEYPAIR_PATH || path.join(os.homedir(), '.config', 'solana', 'id.json');
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')));
  const keyPair = await createKeyPairFromBytes(secretKey);
  const address = await getAddressFromPublicKey(keyPair.publicKey);
  return { keyPair, address };
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: getHeaders(), ...options });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function signAndSend(
  order: OrderResponse,
  keyPair: Awaited<ReturnType<typeof createKeyPairFromBytes>>,
  rpc: SolanaRpc,
): Promise<string> {
  const txBytes = Buffer.from(order.transaction, 'base64');
  const transaction = getTransactionDecoder().decode(txBytes);
  const signedTx = await signTransaction([keyPair], transaction);
  const signature = getSignatureFromTransaction(signedTx);
  assertIsTransactionWithinSizeLimit(signedTx);
  const sendTx = sendTransactionWithoutConfirmingFactory({ rpc });
  await sendTx(signedTx, { commitment: 'confirmed', skipPreflight: false });
  return signature as string;
}

export async function waitForOrder(
  sig: string,
  lastValidBlockHeight: number,
  tradeApiUrl: string,
): Promise<OrderStatusResponse> {
  while (true) {
    const status = await fetchJson<OrderStatusResponse>(
      `${tradeApiUrl}/order-status?signature=${sig}&lastValidBlockHeight=${lastValidBlockHeight}`
    );
    console.log(`  Status: ${status.status}`);
    if (['closed', 'expired', 'failed'].includes(status.status)) return status;
    await new Promise((r) => setTimeout(r, 2_000)); // Wait before next poll to avoid rate-limiting
  }
}

export function parseMintAndBalance(accountData: [string, string]): { mint: string; amount: bigint } {
  const [base64Data] = accountData;
  const data = Buffer.from(base64Data, 'base64');
  const mint = getAddressDecoder().decode(data.subarray(0, 32));
  const amount = data.readBigUInt64LE(64);
  return { mint, amount };
}

// SPL Token programs
export const TOKEN_PROGRAM      = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const TOKEN_2022_PROGRAM = address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

export async function getWalletTokenAccounts(rpc: SolanaRpc, walletAddress: string) {
  const [{ value: legacyAccounts }, { value: token2022Accounts }] = await Promise.all([
    rpc.getTokenAccountsByOwner(address(walletAddress), { programId: TOKEN_PROGRAM },      { encoding: 'base64' }).send(),
    rpc.getTokenAccountsByOwner(address(walletAddress), { programId: TOKEN_2022_PROGRAM }, { encoding: 'base64' }).send(),
  ]);
  return [...legacyAccounts, ...token2022Accounts];
}
