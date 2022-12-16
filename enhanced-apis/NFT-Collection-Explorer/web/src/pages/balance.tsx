// next/src/pages/balance.tsx

import { ethers } from "ethers"
import { useState } from "react"
import { main, title, footer } from "../styles"
import Link from "next/link"

const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function GetWalletTokenBalance() {
  const [balance, setBalance] = useState([])
  const [wallet, setWallet] = useState('')

  async function getWalletTokenBalance() {
    try {
      const method = "qn_getWalletTokenBalance"
      const params = {
        wallet: wallet,
      }

      const data = await provider.send(method, params)
      const { assets } = data

      setBalance(assets)
      console.log(assets)
    } catch (err) {
      console.log("Error: ", err)
    }
  }

  return (
    <main className={main}>
      <h2 className={title}>Get Wallet Token Balance</h2>
      <p>Don't have a wallet?</p>
      <p>Try this one: <code>0xd8da6bf26964af9d7eed9e03e53415d37aa96045</code></p>

      <input onChange={e => setWallet(e.target.value)} placeholder="Enter Wallet" />
      <button onClick={getWalletTokenBalance}>Get Wallet Token Balance</button>

      <span>
        {balance.map(b => (
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