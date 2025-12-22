// next/src/pages/details.tsx

import { ethers } from "ethers"
import { useState } from "react"
import { main, title, footer } from "../styles"
import Link from "next/link"

const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function FetchNFTCollectionDetails() {
  const [details, setDetails] = useState([])
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchNFTCollectionDetails() {
    if (!address) {
      setError('Please enter a contract address')
      return
    }

    setLoading(true)
    setError('')
    setDetails([])

    try {
      const method = "qn_fetchNFTCollectionDetails"
      const params = [{
        contracts: [
          address,
        ],
      }]

      console.log('Fetching NFT collection details for:', address)
      const data = await provider.send(method, params)
      setDetails(data)
    } catch (err) {
      console.error("Error fetching NFT collection details:", err)
      setError(err instanceof Error ? err.message : 'Failed to fetch NFT collection details. Please check the contract address and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={main}>
      <h2 className={title}>Fetch NFT Collection Details</h2>
      <p>Looking for a donut shaped NFT?</p>
      <p>Give this a try: <code>0x2106C00Ac7dA0A3430aE667879139E832307AeAa</code></p>

      <input
        onChange={e => setAddress(e.target.value)}
        placeholder="Enter Address"
        value={address}
      />

      <button onClick={fetchNFTCollectionDetails} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch NFT Collection Details'}
      </button>

      {error && (
        <div style={{ color: 'red', margin: '1rem', padding: '1rem', border: '1px solid red', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <span className="fetch">
        {details.map(d => (
          <div className="card" key={d.name}>
            <h3>Name: {d.name}</h3>
            <p>Address: {d.address}</p>
            <ul>
              <li>erc721: {JSON.stringify(d.erc721)}</li>
              <li>erc1155: {JSON.stringify(d.erc1155)}</li>
              <li>genesisBlock: {d.genesisBlock}</li>
              <li>genesisTransaction: {d.genesisTransaction}</li>
            </ul>
          </div>
        ))}
      </span>
      <footer className={footer}>
        <Link href="/">Return home</Link>
      </footer>
    </main>
  )
}