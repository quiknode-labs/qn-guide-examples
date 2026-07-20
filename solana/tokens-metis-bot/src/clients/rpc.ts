// The only module that constructs the Solana Kit client, the custom
// transport, and the wallet keypair. Everything else depends on the
// RpcClient interface returned by createRpcClient.
//
// Transport pattern: "Quicknode add-ons using Solana Kit". Custom metis_*
// methods are bridged to the Metis REST endpoints; every other method goes
// to the normal Solana JSON-RPC transport. Verified against @solana/kit 7.

import {
  address,
  createDefaultRpcTransport,
  createJsonRpcApi,
  createRpc,
  getBase64Encoder,
  getBase64EncodedWireTransaction,
  getTransactionDecoder,
  partiallySignTransaction,
  signature,
  type Rpc,
  type RpcRequest,
  type RpcTransport,
  type SolanaRpcApi,
} from "@solana/kit";
import { signerFromFile } from "@solana/kit-plugin-signer";
import type {
  MetisQuoteParams,
  MetisQuoteResponse,
  MetisSwapRequest,
  MetisSwapResponse,
} from "./metisTypes.ts";

// Custom add-on methods. Method names map to REST routes via METIS_ROUTES.
type MetisApi = {
  metis_quote(params: MetisQuoteParams): MetisQuoteResponse;
  metis_swap(params: MetisSwapRequest): MetisSwapResponse;
  metis_programIdToLabel(params: Record<string, never>): Record<string, string>;
};

export type BotRpcApi = SolanaRpcApi & MetisApi;
export type BotRpc = Rpc<BotRpcApi>;

const METIS_ROUTES: Record<string, { path: string; verb: "GET" | "POST" }> = {
  metis_quote: { path: "/quote", verb: "GET" },
  metis_swap: { path: "/swap", verb: "POST" },
  metis_programIdToLabel: { path: "/program-id-to-label", verb: "GET" },
};

// Bridge one metis_* call to its REST endpoint. GET params become query
// strings (arrays comma-joined, which matches the Metis dexes format);
// POST params become the JSON body. The result is wrapped in { result }
// so the shared responseTransformer unwraps REST and JSON-RPC uniformly.
async function handleMetisRequest<TResponse>(
  method: string,
  params: unknown,
  metisEndpoint: string,
): Promise<TResponse> {
  const route = METIS_ROUTES[method];
  if (!route) {
    throw new Error(`Unknown Metis method: ${method}`);
  }
  const paramsToUse = Array.isArray(params) ? params[0] : params;
  const url = new URL(`${metisEndpoint}${route.path}`);
  const init: RequestInit = { method: route.verb };

  if (route.verb === "GET") {
    if (typeof paramsToUse === "object" && paramsToUse !== null) {
      for (const [key, value] of Object.entries(paramsToUse as Record<string, unknown>)) {
        if (value === undefined || value === null) continue;
        url.searchParams.append(key, Array.isArray(value) ? value.join(",") : String(value));
      }
    }
  } else {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(paramsToUse ?? {});
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Metis ${route.verb} ${route.path} failed: ${response.status} ${response.statusText}` +
        (body ? ` — ${body.slice(0, 500)}` : ""),
    );
  }
  const data: unknown = await response.json();
  return { result: data } as TResponse;
}

function createBotTransport(solanaRpcUrl: string, metisEndpoint: string): RpcTransport {
  const jsonRpcTransport = createDefaultRpcTransport({ url: solanaRpcUrl });
  return async <TResponse,>(...args: Parameters<RpcTransport>): Promise<TResponse> => {
    const { method, params } = args[0].payload as { method: string; params: unknown };
    if (method.startsWith("metis_")) {
      return handleMetisRequest<TResponse>(method, params, metisEndpoint);
    }
    return jsonRpcTransport(...args) as Promise<TResponse>;
  };
}

function createBotRpc(solanaRpcUrl: string, metisEndpoint: string): BotRpc {
  const api = createJsonRpcApi<BotRpcApi>({
    // Add-on methods take a single object param; native Solana methods keep
    // their positional array params. In @solana/kit 7 requestTransformer must
    // return a full RpcRequest (methodName + params), not bare params, or the
    // method name is lost and the transport cannot route the call.
    requestTransformer: (request: RpcRequest<unknown>): RpcRequest => {
      if (request.methodName.startsWith("metis_")) {
        return {
          ...request,
          params: Array.isArray(request.params) ? request.params[0] : request.params,
        };
      }
      return request;
    },
    responseTransformer: (response: unknown) => {
      const envelope = response as { result?: unknown; error?: { code?: number; message?: string } };
      if (envelope.error) {
        throw new Error(
          `RPC error ${envelope.error.code ?? ""}: ${envelope.error.message ?? "unknown"}`,
        );
      }
      return envelope.result;
    },
  });
  const transport = createBotTransport(solanaRpcUrl, metisEndpoint);
  return createRpc({ api, transport }) as BotRpc;
}

export interface TokenBalance {
  mint: string;
  amountBaseUnits: string;
  decimals: number;
}

export interface Balances {
  solLamports: bigint;
  tokens: TokenBalance[];
}

export interface RpcClient {
  rpc: BotRpc;
  walletAddress: string;
  getBalances(owner: string): Promise<Balances>;
  signAndSend(base64Tx: string): Promise<string>;
  toBaseUnits(uiAmount: number, mint: string): Promise<string>;
  fromBaseUnits(amountBaseUnits: string, mint: string): Promise<number>;
}

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export async function createRpcClient(
  solanaRpcUrl: string,
  metisEndpoint: string,
  walletKeypairPath: string,
): Promise<RpcClient> {
  // Load the wallet from a Solana CLI keypair file via the kit signer
  // plugin. signerFromFile reads the JSON keypair (Node only) and installs
  // a KeyPairSigner into both signer roles; applying it to an empty object
  // yields that signer directly, without building a full plugin client.
  // Only the file path passes through config; the secret bytes never enter
  // any serializable object or log line.
  const { payer: wallet } = await signerFromFile(walletKeypairPath)({});

  const rpc = createBotRpc(solanaRpcUrl, metisEndpoint);
  const decimalsCache = new Map<string, number>();

  async function getDecimals(mint: string): Promise<number> {
    const cached = decimalsCache.get(mint);
    if (cached !== undefined) return cached;
    const supply = await rpc.getTokenSupply(address(mint)).send();
    // Kit returns decimals as a number here, but coerce defensively: some RPC
    // numeric fields deserialize as BigInt, which breaks toFixed / ** later.
    const decimals = Number(supply.value.decimals);
    decimalsCache.set(mint, decimals);
    return decimals;
  }

  async function getBalances(owner: string): Promise<Balances> {
    const ownerAddr = address(owner);
    const [sol, spl, spl2022] = await Promise.all([
      rpc.getBalance(ownerAddr).send(),
      rpc
        .getTokenAccountsByOwner(ownerAddr, { programId: address(TOKEN_PROGRAM) }, { encoding: "jsonParsed" })
        .send(),
      rpc
        .getTokenAccountsByOwner(ownerAddr, { programId: address(TOKEN_2022_PROGRAM) }, { encoding: "jsonParsed" })
        .send(),
    ]);

    const tokens: TokenBalance[] = [...spl.value, ...spl2022.value].map((account) => {
      const info = account.account.data.parsed.info;
      return {
        mint: info.mint,
        amountBaseUnits: info.tokenAmount.amount,
        decimals: info.tokenAmount.decimals,
      };
    });

    return { solLamports: sol.value, tokens };
  }

  async function signAndSend(base64Tx: string): Promise<string> {
    const txBytes = getBase64Encoder().encode(base64Tx);
    const tx = getTransactionDecoder().decode(txBytes);
    const signed = await partiallySignTransaction([wallet.keyPair], tx);
    const wire = getBase64EncodedWireTransaction(signed);

    // Simulate before sending; refuse to send a transaction that fails
    // simulation instead of burning the fee on a doomed swap.
    const simulation = await rpc
      .simulateTransaction(wire, { encoding: "base64", replaceRecentBlockhash: true, sigVerify: false })
      .send();
    if (simulation.value.err) {
      throw new Error(`Simulation failed, refusing to send: ${JSON.stringify(simulation.value.err)}`);
    }

    const sig = await rpc
      .sendTransaction(wire, { encoding: "base64", skipPreflight: false, maxRetries: 3n })
      .send();

    // Confirm by polling signature status.
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const statuses = await rpc
        .getSignatureStatuses([signature(sig)], { searchTransactionHistory: false })
        .send();
      const status = statuses.value[0];
      if (status) {
        if (status.err) {
          throw new Error(`Transaction ${sig} failed on-chain: ${JSON.stringify(status.err)}`);
        }
        if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
          return sig;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    throw new Error(`Transaction ${sig} not confirmed within 60s`);
  }

  async function toBaseUnits(uiAmount: number, mint: string): Promise<string> {
    const decimals = await getDecimals(mint);
    // String math instead of float multiplication to avoid precision loss.
    const [whole = "0", frac = ""] = uiAmount.toFixed(decimals).split(".");
    return BigInt(whole + frac.padEnd(decimals, "0")).toString();
  }

  async function fromBaseUnits(amountBaseUnits: string, mint: string): Promise<number> {
    const decimals = await getDecimals(mint);
    return Number(amountBaseUnits) / 10 ** decimals;
  }

  return {
    rpc,
    walletAddress: wallet.address,
    getBalances,
    signAndSend,
    toBaseUnits,
    fromBaseUnits,
  };
}
