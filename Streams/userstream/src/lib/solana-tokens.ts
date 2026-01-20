import { prisma } from '@/lib/prisma'
import * as solanaKit from '@solana/kit'

type TokenListEntry = {
  address: string
  name?: string
  symbol?: string
  decimals?: number
}

type SolanaRpcResponse<T> = {
  result?: T
  error?: { message?: string }
}

const TOKEN_LIST_BASE_URL = 'https://lite-api.jup.ag/tokens/v2'
const VERIFIED_TOKEN_LIST_URL = `${TOKEN_LIST_BASE_URL}/tag?query=verified`
const TOKEN_LIST_TTL_MS = 6 * 60 * 60 * 1000
const TOKEN_SEARCH_TTL_MS = 60 * 60 * 1000
const TOKEN_SEARCH_MIN_INTERVAL_MS = 1100

let tokenListCache: {
  fetchedAt: number
  tokens: Map<string, TokenListEntry>
} | null = null
const tokenSearchCache = new Map<string, { fetchedAt: number; entry: TokenListEntry | null }>()
let lastTokenSearchAt = 0

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getSolanaRpcUrl() {
  return process.env.QN_SOLANA_ENDPOINT
}

function getTokenListData(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!isRecord(payload)) return []
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.tokens)) return payload.tokens
  return []
}

function parseTokenEntry(entry: unknown): TokenListEntry | null {
  if (!isRecord(entry)) return null
  const address =
    typeof entry.address === 'string'
      ? entry.address
      : typeof entry.id === 'string'
        ? entry.id
        : null
  if (!address) return null

  return {
    address,
    name: typeof entry.name === 'string' ? entry.name : undefined,
    symbol: typeof entry.symbol === 'string' ? entry.symbol : undefined,
    decimals: typeof entry.decimals === 'number' ? entry.decimals : undefined,
  }
}

function formatLamportsManual(lamports: bigint): string {
  const whole = lamports / 1_000_000_000n
  const fraction = lamports % 1_000_000_000n

  if (fraction === 0n) return whole.toString()

  const fractionText = fraction.toString().padStart(9, '0').replace(/0+$/, '')
  return `${whole.toString()}.${fractionText}`
}

export function formatLamports(amountLamports: string): string {
  try {
    const lamports = BigInt(amountLamports)
    const kit = solanaKit as unknown as {
      lamportsToSol?: (value: bigint) => number | string | bigint
    }
    if (typeof kit.lamportsToSol === 'function') {
      const solValue = kit.lamportsToSol(lamports)
      if (typeof solValue === 'number' && Number.isFinite(solValue)) {
        const text = solValue.toString()
        return text.includes('e') || text.includes('E')
          ? formatLamportsManual(lamports)
          : text
      }
      if (typeof solValue === 'string') {
        return solValue
      }
    }
    return formatLamportsManual(lamports)
  } catch {
    return '0'
  }
}

async function solanaRpcRequest<T>(
  method: string,
  params: unknown[]
): Promise<T | null> {
  const url = getSolanaRpcUrl()
  if (!url) return null

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  })

  if (!response.ok) return null

  const payload = (await response.json()) as SolanaRpcResponse<T>
  if (payload.error) return null
  return payload.result ?? null
}

async function fetchTokenList(): Promise<Map<string, TokenListEntry> | null> {
  if (tokenListCache && Date.now() - tokenListCache.fetchedAt < TOKEN_LIST_TTL_MS) {
    return tokenListCache.tokens
  }

  try {
    const response = await fetch(VERIFIED_TOKEN_LIST_URL)
    if (!response.ok) return null

    const payload = (await response.json()) as unknown
    const data = getTokenListData(payload)

    const tokens = new Map<string, TokenListEntry>()

    for (const entry of data) {
      const parsed = parseTokenEntry(entry)
      if (!parsed) continue
      tokens.set(parsed.address, parsed)
    }

    tokenListCache = { fetchedAt: Date.now(), tokens }
    return tokens
  } catch (error) {
    console.error('Solana token list fetch failed:', error)
    return null
  }
}

async function fetchTokenBySearch(mint: string): Promise<TokenListEntry | null> {
  const cached = tokenSearchCache.get(mint)
  if (cached && Date.now() - cached.fetchedAt < TOKEN_SEARCH_TTL_MS) {
    return cached.entry
  }

  const now = Date.now()
  if (now - lastTokenSearchAt < TOKEN_SEARCH_MIN_INTERVAL_MS) {
    return null
  }
  lastTokenSearchAt = now

  try {
    const response = await fetch(
      `${TOKEN_LIST_BASE_URL}/search?query=${encodeURIComponent(mint)}`
    )
    if (!response.ok) return null

    const payload = (await response.json()) as unknown
    const data = getTokenListData(payload)
    const match = data.find((entry) => {
      const parsed = parseTokenEntry(entry)
      return parsed?.address === mint
    })
    const parsed = parseTokenEntry(match)
    tokenSearchCache.set(mint, { fetchedAt: Date.now(), entry: parsed })
    return parsed
  } catch (error) {
    console.error('Solana token search failed:', error)
    return null
  }
}

async function getMintDecimals(mint: string): Promise<number | null> {
  const result = await solanaRpcRequest<{ value?: { decimals?: number } }>(
    'getTokenSupply',
    [mint]
  )
  const decimals = result?.value?.decimals
  return typeof decimals === 'number' ? decimals : null
}

export async function getOrFetchSolanaToken(
  mint: string,
  chain: string = 'solana-mainnet'
) {
  const cached = await prisma.token.findUnique({
    where: { address: mint },
  })

  if (cached) return cached

  let name = 'Unknown Token'
  let symbol = 'UNKNOWN'
  let decimals = 0

  if (chain === 'solana-mainnet') {
    const tokens = await fetchTokenList()
    let entry = tokens?.get(mint)
    if (!entry) {
      entry = await fetchTokenBySearch(mint)
    }

    if (entry) {
      if (typeof entry.name === 'string') {
        name = entry.name
      }
      if (typeof entry.symbol === 'string') {
        symbol = entry.symbol
      }
      if (typeof entry.decimals === 'number') {
        decimals = entry.decimals
      }
    }
  }

  try {
    const rpcDecimals = await getMintDecimals(mint)
    if (rpcDecimals !== null) {
      decimals = rpcDecimals
    }
  } catch (error) {
    console.error('Solana token decimals fetch failed:', error)
  }

  try {
    return await prisma.token.create({
      data: { address: mint, name, symbol, decimals, chain },
    })
  } catch (error) {
    console.error('Solana token cache write failed:', error)
  }

  const fallback = await prisma.token.findUnique({
    where: { address: mint },
  })

  return (
    fallback ?? {
      address: mint,
      name,
      symbol,
      decimals,
      chain,
    }
  )
}
