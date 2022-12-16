// next/src/pages/collections.tsx

import { ethers } from "ethers"
import { useState } from "react"
import { main, title, footer } from "../styles"
import Link from "next/link"

const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function FetchNFTsByCollection() {
  const [collection, setCollection] = useState([])
  const [address, setAddress] = useState('')

  async function fetchNFTsByCollection() {
    try {
      const method = "qn_fetchNFTsByCollection"
      const params =  {
        collection: address,
        omitFields: ["traits"],
        page: 1,
        perPage: 3,
      }

      const data = await provider.send(method, params)
      const { tokens } = data

      setCollection(tokens)
      console.log(tokens)
    } catch (err) {
      console.log({err})
    }
  }

  return (
    <main className={main}>
      <h2 className={title}>NFTs by Collection</h2>
      <p>Don't know any NFT collections off the top of your head?</p>
      <p>Try this one: <code>0x2106C00Ac7dA0A3430aE667879139E832307AeAa</code></p>

      <input onChange={e => setAddress(e.target.value)} placeholder="Enter NFT Collection" />
      <button onClick={fetchNFTsByCollection}>
        Fetch NFTs By Collection
      </button>

      <span className="fetch">
        {collection.map(c => (
          <div className="card" key={c.name}>
            <h3>{c.collectionName}</h3>
            <img src={c.imageUrl} width="100" height="100" />
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
