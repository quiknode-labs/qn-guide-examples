// next/src/pages/collections.tsx

import { ethers } from "ethers"
import { useState } from "react"
import { main, title, footer } from "../styles"
import Link from "next/link"

const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function FetchNFTsByCollection() {
  const [collection, setCollection] = useState([])
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchNFTsByCollection() {
    if (!address) {
      setError('Please enter a collection address')
      return
    }

    setLoading(true)
    setError('')
    setCollection([])

    try {
      const method = "qn_fetchNFTsByCollection"
      const params =  [{
        collection: address,
        omitFields: ["traits"],
        page: 1,
        perPage: 3,
      }]

      console.log('Fetching NFTs for collection:', address)
      const data = await provider.send(method, params)
      const { tokens } = data

      setCollection(tokens)
    } catch (err) {
      console.error("Error fetching NFTs:", err)
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs. Please check the collection address and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={main}>
      <h2 className={title}>NFTs by Collection</h2>
      <p>Don't know any NFT collections off the top of your head?</p>
      <p>Try this one: <code>0x2106C00Ac7dA0A3430aE667879139E832307AeAa</code></p>

      <input
        onChange={e => setAddress(e.target.value)}
        placeholder="Enter NFT Collection"
        value={address}
      />
      <button onClick={fetchNFTsByCollection} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch NFTs By Collection'}
      </button>

      {error && (
        <div style={{ color: 'red', margin: '1rem', padding: '1rem', border: '1px solid red', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <span className="fetch">
        {collection.map((c: any) => (
          <div className="card" key={c.name}>
            <h3>{c.collectionName}</h3>
            <img src={c.imageUrl} width="100" height="100" alt={c.name} />
            <p>{c.name}</p>
          </div>
        ))}
      </span>
      <footer className={footer}>
        <Link href="/">Return home</Link>
      </footer>
    </main>
  )
}
