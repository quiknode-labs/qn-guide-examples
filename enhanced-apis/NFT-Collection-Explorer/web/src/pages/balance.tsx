// next/src/pages/balance.tsx

import { ethers } from "ethers"
import { useState } from "react"
import { main, title, footer } from "../styles"
import Link from "next/link"

const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function GetWalletTokenBalance() {
  const [balance, setBalance] = useState([])
  const [wallet, setWallet] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function getWalletTokenBalance() {
    if (!wallet) {
      setError('Please enter a wallet address')
      return
    }

    setLoading(true)
    setError('')
    setBalance([])

    try {
      const method = "qn_getWalletTokenBalance"
      const params = [{
        wallet: wallet,
      }]

      console.log('Fetching wallet token balance for:', wallet)
      const data = await provider.send(method, params)
      
      const { result } = data

      setBalance(result)
    } catch (err) {
      console.error("Error fetching wallet balance:", err)
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet balance. Please check the wallet address and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={main}>
      <h2 className={title}>Get Wallet Token Balance</h2>
      <p>Don't have a wallet?</p>
      <p>Try this one: <code>0xd8da6bf26964af9d7eed9e03e53415d37aa96045</code></p>

      <input
        onChange={e => setWallet(e.target.value)}
        placeholder="Enter Wallet"
        value={wallet}
      />
      <button onClick={getWalletTokenBalance} disabled={loading}>
        {loading ? 'Loading...' : 'Get Wallet Token Balance'}
      </button>

      {error && (
        <div style={{ color: 'red', margin: '1rem', padding: '1rem', border: '1px solid red', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <span>
        {balance.map((b: any) => (
          <div className="card" key={b.name}>
            <h3>Name: {b.name}</h3>
            <p>Symbol: {b.symbol} - #{b.amount}</p>
          </div>
        ))}
      </span>
      <footer className={footer}>
        <Link href="/">Return home</Link>
      </footer>
    </main>
  )
}