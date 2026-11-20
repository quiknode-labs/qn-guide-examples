import { PublicKey } from "@solana/web3.js";
import { ExtensionType, getExtensionData, getScaledUiAmountConfig, unpackMint } from "@solana/spl-token";
import { unpack as unpackTokenMetadata } from "@solana/spl-token-metadata";
import { ISSUER, TOKEN_2022 } from "./config.ts";
import { rpc, withRetry } from "./rpc.ts";

const TOKEN_2022_KEY = new PublicKey(TOKEN_2022);

export interface MintState {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  /** Raw supply (u64 at bytes 36 to 44 of the mint account). */
  supplyRaw: bigint;
  /** Scaled UI multiplier in effect before `newMultiplierEffectiveTimestamp`. */
  multiplier: number;
  newMultiplier: number;
  /** Unix seconds. 0 when no change has ever been scheduled. */
  newMultiplierEffectiveTimestamp: number;
}

/** The multiplier that applies at `unixSeconds`. */
export function multiplierAt(mint: MintState, unixSeconds: number): number {
  const scheduled = mint.newMultiplierEffectiveTimestamp;
  return scheduled !== 0 && unixSeconds >= scheduled ? mint.newMultiplier : mint.multiplier;
}

export function rawToShares(mint: MintState, raw: bigint | number, unixSeconds: number): number {
  return (Number(raw) / 10 ** mint.decimals) * multiplierAt(mint, unixSeconds);
}

/**
 * Parse a Token-2022 mint account. The Scaled UI config and the metadata are
 * extensions stored after the base mint, so their offsets differ per mint.
 * `unpackMint` walks the extension list for us.
 */
export function parseMintAccount(address: string, data: Uint8Array, previous?: MintState): MintState | null {
  try {
    const key = new PublicKey(address);
    const mint = unpackMint(key, { data: Buffer.from(data), owner: TOKEN_2022_KEY, executable: false, lamports: 0 }, TOKEN_2022_KEY);
    const scaled = getScaledUiAmountConfig(mint);
    let symbol = previous?.symbol ?? address.slice(0, 6);
    let name = previous?.name ?? symbol;
    const metadataBytes = getExtensionData(ExtensionType.TokenMetadata, mint.tlvData);
    if (metadataBytes) {
      const metadata = unpackTokenMetadata(metadataBytes);
      symbol = metadata.symbol || symbol;
      name = metadata.name || name;
    }
    return {
      address,
      symbol,
      name,
      decimals: mint.decimals,
      supplyRaw: mint.supply,
      multiplier: scaled?.multiplier ?? 1,
      newMultiplier: scaled?.newMultiplier ?? 1,
      newMultiplierEffectiveTimestamp: scaled ? Number(scaled.newMultiplierEffectiveTimestamp) : 0,
    };
  } catch {
    return null;
  }
}

export type RegistrySource = "getProgramAccounts" | "backed-api";

/**
 * Find every Token-2022 mint whose mintAuthority is Backed's issuer key.
 * The mint authority is a COption<Pubkey> at offset 0, so the key starts at offset 4.
 * A scan of the whole Token-2022 program can time out on a cold node, so retry,
 * then fall back to Backed's public token list (still verified onchain below).
 */
export async function discoverMints(): Promise<{ addresses: string[]; source: RegistrySource }> {
  try {
    const accounts = await withRetry("getProgramAccounts", 4, () =>
      rpc<{ pubkey: string }[]>("getProgramAccounts", [
        TOKEN_2022,
        {
          commitment: "finalized",
          encoding: "base64",
          dataSlice: { offset: 0, length: 0 },
          filters: [{ memcmp: { offset: 4, bytes: ISSUER } }],
        },
      ]),
    );
    if (accounts.length > 0) return { addresses: accounts.map((a) => a.pubkey), source: "getProgramAccounts" };
  } catch (error) {
    console.warn(`[registry] getProgramAccounts gave up, using Backed's token list: ${(error as Error).message}`);
  }
  const response = await fetch("https://api.xstocks.fi/api/v1/token", { signal: AbortSignal.timeout(30_000) });
  const list = (await response.json()) as { nodes: { deployments: { network: string; address: string }[] }[] };
  const addresses = list.nodes
    .flatMap((node) => node.deployments)
    .filter((d) => d.network === "Solana")
    .map((d) => d.address.replace(/^svm:/, ""));
  return { addresses, source: "backed-api" };
}

/**
 * Read supply, multiplier, and metadata for every mint with getMultipleAccounts
 * (100 accounts per call). Accounts that are not issuer-owned Token-2022 mints are dropped,
 * which is what makes the fallback list safe to use.
 */
export async function readMintStates(
  addresses: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, MintState>> {
  const result = new Map<string, MintState>();
  for (let i = 0; i < addresses.length; i += 100) {
    const batch = addresses.slice(i, i + 100);
    const response = await withRetry("getMultipleAccounts", 4, () =>
      rpc<{ value: ({ data: [string, string]; owner: string } | null)[] }>("getMultipleAccounts", [
        batch,
        { commitment: "finalized", encoding: "base64" },
      ]),
    );
    response.value.forEach((account, index) => {
      if (!account || account.owner !== TOKEN_2022) return;
      const data = Buffer.from(account.data[0], "base64");
      // COption tag (4 bytes) then the authority key.
      if (data.readUInt32LE(0) !== 1 || new PublicKey(data.subarray(4, 36)).toBase58() !== ISSUER) return;
      const state = parseMintAccount(batch[index], data);
      if (state) result.set(state.address, state);
    });
    onProgress?.(Math.min(i + 100, addresses.length), addresses.length);
  }
  return result;
}
