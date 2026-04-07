import { tempo } from 'mppx/client'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { formatUnits } from 'viem'
import { existsSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// ─── Configuration ───────────────────────────────────────────────────────────

const WALLET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' // Vitalik's address
const MAX_DEPOSIT = '1' // 1 PathUSD — covers 100,000 requests at $0.00001/each
const MPP_BASE_URL = 'https://mpp.quicknode.com/session'

// ─── Chain Registry ──────────────────────────────────────────────────────────

const CHAINS = [
  { slug: 'ethereum-mainnet', name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  { slug: 'base-mainnet', name: 'Base', symbol: 'ETH', decimals: 18 },
  { slug: 'arbitrum-mainnet', name: 'Arbitrum', symbol: 'ETH', decimals: 18 },
  { slug: 'optimism-mainnet', name: 'Optimism', symbol: 'ETH', decimals: 18 },
  { slug: 'matic-mainnet', name: 'Polygon', symbol: 'POL', decimals: 18 },
  { slug: 'worldchain-mainnet', name: 'World Chain', symbol: 'ETH', decimals: 18 },
  { slug: 'bsc-mainnet', name: 'BNB Chain', symbol: 'BNB', decimals: 18 },
  { slug: 'fantom-mainnet', name: 'Fantom', symbol: 'FTM', decimals: 18 },
  { slug: 'celo-mainnet', name: 'Celo', symbol: 'CELO', decimals: 18 },
  { slug: 'xdai-mainnet', name: 'Gnosis', symbol: 'xDAI', decimals: 18 },
  { slug: 'zksync-mainnet', name: 'zkSync Era', symbol: 'ETH', decimals: 18 },
  { slug: 'scroll-mainnet', name: 'Scroll', symbol: 'ETH', decimals: 18 },
  { slug: 'linea-mainnet', name: 'Linea', symbol: 'ETH', decimals: 18 },
  { slug: 'mantle-mainnet', name: 'Mantle', symbol: 'MNT', decimals: 18 },
  { slug: 'blast-mainnet', name: 'Blast', symbol: 'ETH', decimals: 18 },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface BalanceResult {
  chain: string
  symbol: string
  balance: string
  status: 'ok' | 'error'
  error?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBalance(hexBalance: string, decimals: number): string {
  const value = BigInt(hexBalance)
  return parseFloat(formatUnits(value, decimals)).toFixed(4)
}

function pad(str: string, len: number): string {
  return str.padEnd(len)
}

function printHeader() {
  console.log()
  console.log('Multichain Balance Checker (via MPP Session)')
  console.log('━'.repeat(56))
}

function printResults(results: BalanceResult[]) {
  console.log()
  console.log(` ${pad('Chain', 18)}| ${pad('Balance', 22)}| Status`)
  console.log('─'.repeat(18) + '┼' + '─'.repeat(23) + '┼' + '─'.repeat(10))
  for (const r of results) {
    if (r.status === 'ok') {
      console.log(` ${pad(r.chain, 17)}| ${pad(`${r.balance} ${r.symbol}`, 22)}| ok`)
    } else {
      console.log(` ${pad(r.chain, 17)}| ${pad('—', 22)}| ${r.error ?? 'error'}`)
    }
  }
}

function printSummary(
  results: BalanceResult[],
  totalRequests: number,
  channelId: string | undefined,
  cumulativeSpend: bigint,
  txHash: string | undefined,
) {
  const successCount = results.filter((r) => r.status === 'ok').length
  const spentPathUSD = parseFloat(formatUnits(cumulativeSpend, 6))
  const deposit = parseFloat(MAX_DEPOSIT)
  const refund = deposit - spentPathUSD

  console.log()
  console.log('━'.repeat(56))
  console.log(' Session Summary')
  console.log('━'.repeat(56))
  console.log(` Chains queried:    ${results.length} (${successCount} ok, ${results.length - successCount} errors)`)
  console.log(` Total RPC calls:   ${totalRequests}`)
  console.log(` Session cost:      ${spentPathUSD.toFixed(6)} PathUSD ($${spentPathUSD.toFixed(5)})`)
  console.log(` Channel deposit:   ${deposit.toFixed(6)} PathUSD`)
  console.log(` Refunded:          ${refund.toFixed(6)} PathUSD`)
  if (channelId) console.log(` Channel ID:        ${channelId}`)
  if (txHash) console.log(` Settlement tx:     ${txHash}`)
  console.log()
}

// ─── Faucet & Balance Check ──────────────────────────────────────────────────

const TEMPO_RPC = 'https://rpc.moderato.tempo.xyz'
const PATHUSD_ADDRESS = '0x20c0000000000000000000000000000000000000'
// balanceOf(address) selector
const BALANCE_OF_SELECTOR = '0x70a08231'

async function getPathUSDBalance(walletAddress: string): Promise<bigint> {
  const data = BALANCE_OF_SELECTOR + walletAddress.slice(2).padStart(64, '0')
  const res = await fetch(TEMPO_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'eth_call',
      params: [{ to: PATHUSD_ADDRESS, data }, 'latest'],
    }),
  })
  const json = (await res.json()) as { result?: string }
  return BigInt(json.result ?? '0x0')
}

async function waitForFunding(address: string, maxWaitMs = 30_000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const balance = await getPathUSDBalance(address)
    if (balance > 0n) {
      console.log(`Faucet: PathUSD balance confirmed (${formatUnits(balance, 6)} PathUSD)`)
      return
    }
    await new Promise((r) => setTimeout(r, 2_000))
  }
  console.log('Faucet: Timed out waiting for balance — proceeding anyway')
}

async function fundWallet(address: string): Promise<void> {
  try {
    console.log('Funding wallet via Tempo testnet faucet...')
    const res = await fetch('https://docs.tempo.xyz/api/faucet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
    if (res.ok) {
      console.log('Faucet: Request accepted — waiting for on-chain confirmation...')
      await waitForFunding(address)
      return
    }
    const body = await res.text()
    if (body.includes('already') || body.includes('limit')) {
      console.log('Faucet: Wallet already funded (or limit reached)')
      return
    }
    console.log(`Faucet: Unexpected response (${res.status}) — ${body}`)
  } catch (err) {
    console.log(`Faucet: Request failed — ${err instanceof Error ? err.message : err}`)
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  printHeader()

  // Set up wallet
  const envPath = resolve(process.cwd(), '.env')
  const isGenerated = !process.env.MPPX_PRIVATE_KEY
  const privateKey = (process.env.MPPX_PRIVATE_KEY as `0x${string}`) || generatePrivateKey()
  const account = privateKeyToAccount(privateKey)

  console.log()
  console.log(`Wallet:  ${account.address}${isGenerated ? ' (auto-generated)' : ''}`)
  console.log(`Target:  ${WALLET_ADDRESS}`)

  // Persist auto-generated key to .env so it can be reused across runs
  if (isGenerated) {
    if (!existsSync(envPath)) {
      writeFileSync(
        envPath,
        [
          '# Auto-generated by multichain balance checker',
          '# This file is gitignored — never commit private keys.',
          `MPPX_PRIVATE_KEY=${privateKey}`,
          '',
        ].join('\n'),
        { mode: 0o600 }, // owner read/write only
      )
      console.log()
      console.log('  Note: Private key saved to .env (gitignored, chmod 600).')
      console.log("        Add `--env-file=.env` to your command to load it.")
      console.log('        Future runs will reuse this wallet automatically.')
    } else {
      console.log()
      console.log('  Note: .env exists but MPPX_PRIVATE_KEY is not set.')
      console.log('        Add it manually if you want to reuse a wallet.')
      console.log("        Add `--env-file=.env` to your command to load it.");
    }
    await fundWallet(account.address)
  }

  // Create MPP session
  console.log()
  console.log('Session: Opening payment channel...')
  console.log(`Deposit: ${MAX_DEPOSIT} PathUSD (testnet)`)

  const session = tempo.session({
    account,
    maxDeposit: MAX_DEPOSIT,
  })

  const results: BalanceResult[] = []
  let totalRequests = 0

  try {
    // Query balances across all chains sequentially
    for (const chain of CHAINS) {
      try {
        const rpcBody = JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [WALLET_ADDRESS, 'latest'],
        })

        // Retry once on 404 (transient MPP routing issues)
        let response = await session.fetch(`${MPP_BASE_URL}/${chain.slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: rpcBody,
        })
        totalRequests++

        if (response.status === 404) {
          response = await session.fetch(`${MPP_BASE_URL}/${chain.slug}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: rpcBody,
          })
          totalRequests++
        }

        if (!response.ok) {
          results.push({
            chain: chain.name,
            symbol: chain.symbol,
            balance: '0',
            status: 'error',
            error: `HTTP ${response.status}`,
          })
          continue
        }

        const data = (await response.json()) as { result?: string; error?: { message: string } }

        if (data.error) {
          results.push({
            chain: chain.name,
            symbol: chain.symbol,
            balance: '0',
            status: 'error',
            error: data.error.message,
          })
          continue
        }

        const balance = formatBalance(data.result!, chain.decimals)
        results.push({
          chain: chain.name,
          symbol: chain.symbol,
          balance,
          status: 'ok',
        })

        // Progress indicator
        process.stdout.write(`\r  Queried ${results.length}/${CHAINS.length} chains...`)
      } catch (err) {
        totalRequests++
        results.push({
          chain: chain.name,
          symbol: chain.symbol,
          balance: '0',
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    // Clear progress line
    process.stdout.write('\r' + ' '.repeat(40) + '\r')

    // Print results
    printResults(results)

    // Close session and get receipt
    console.log()
    // Capture session data before closing
    const channelId = session.channelId
    const cumulativeSpend = session.cumulative

    console.log('Closing session and settling on-chain...')
    const receipt = await session.close()

    printSummary(
      results,
      totalRequests,
      channelId,
      cumulativeSpend,
      receipt?.txHash,
    )

    console.log(receipt)
  } catch (err) {
    console.error('\nFatal error:', err instanceof Error ? err.message : err)

    // Attempt to close session even on error
    try {
      await session.close()
      console.log('Session closed after error.')
    } catch {
      console.log('Could not close session.')
    }

    process.exit(1)
  }
}

main()
