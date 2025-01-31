'use client'

import { useState, useEffect } from 'react'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'

const KNOWN_TOKENS = {
  'So11111111111111111111111111111111111111112': {
    name: 'Wrapped SOL',
    symbol: 'SOL'
  },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    name: 'USD Coin',
    symbol: 'USDC'
  },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
    name: 'USDT',
    symbol: 'USDT'
  },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': {
    name: 'Jupiter',
    symbol: 'JUP'
  }
}

export default function TopTokens({ tokens, loading }) {
  const [tokenInfo, setTokenInfo] = useState({})
  const [fetchingTokens, setFetchingTokens] = useState(false)

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!tokens || !process.env.NEXT_PUBLIC_QUICKNODE_RPC_URL) return

      setFetchingTokens(true)
      const connection = new Connection(process.env.NEXT_PUBLIC_QUICKNODE_RPC_URL)
      const metaplex = new Metaplex(connection)
      metaplex.use(keypairIdentity(Keypair.generate()))

      const info = {}
      for (const token of tokens) {
        try {
          // Check known tokens first
          if (KNOWN_TOKENS[token.mint]) {
            info[token.mint] = KNOWN_TOKENS[token.mint]
            continue
          }

          const mintPublicKey = new PublicKey(token.mint)
          const metadata = await metaplex.nfts().findByMint({ mintAddress: mintPublicKey })

          info[token.mint] = {
            name: metadata.name || formatAddress(token.mint),
            symbol: metadata.symbol || '???'
          }
        } catch (err) {
          console.error(`Error fetching metadata for token ${token.mint}:`, err)
          // Fallback to token account info if metadata fetch fails
          try {
            const mintInfo = await connection.getParsedAccountInfo(new PublicKey(token.mint))
            if (mintInfo?.value?.data?.parsed?.info) {
              info[token.mint] = {
                name: mintInfo.value.data.parsed.info.name || formatAddress(token.mint),
                symbol: mintInfo.value.data.parsed.info.symbol || '???'
              }
            } else {
              info[token.mint] = {
                name: formatAddress(token.mint),
                symbol: '???'
              }
            }
          } catch (fallbackErr) {
            info[token.mint] = {
              name: formatAddress(token.mint),
              symbol: '???'
            }
          }
        }
      }

      setTokenInfo(info)
      setFetchingTokens(false)
    }

    fetchTokenInfo()
  }, [tokens])

  const formatAddress = (address) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div>Loading top tokens...</div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-[#575555]">Top Tokens</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th scope="col" className="text-left py-3 px-4 text-[#595857]">Token</th>
              <th scope="col" className="text-left py-3 px-4 text-[#595857]">Symbol</th>
              <th scope="col" className="text-left py-3 px-4 text-[#595857]">Mint Address</th>
              <th scope="col" className="text-right py-3 px-4 text-[#595857]">Volume</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.mint} className="border-b">
                <td className="py-3 px-4 text-[#1c1c1b]">
                  <span>{fetchingTokens ? 'Loading...' : tokenInfo[token.mint]?.name || formatAddress(token.mint)}</span>
                </td>
                <td className="py-3 px-4 text-[#1c1c1b]">
                  <span>{fetchingTokens ? 'Loading...' : tokenInfo[token.mint]?.symbol || '???'}</span>
                </td>
                <td className="py-3 px-4 text-[#1c1c1b]">
                  <code className="font-mono text-sm">{token.mint}</code>
                </td>
                <td className="py-3 px-4 text-right text-[#1c1c1b]">
                  <span>{token.volume.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}