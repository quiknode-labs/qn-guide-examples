// next/src/pages/details.tsx

import { ethers } from "ethers"
import { useState } from "react"
import { main, title, footer } from "../styles"
import Link from "next/link"

const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function FetchNFTCollectionDetails() {
  const [details, setDetails] = useState([])
  const [address, setAddress] = useState('')

  async function fetchNFTCollectionDetails() {
    try {
      const method = "qn_fetchNFTCollectionDetails"
      const params = {
        contracts: [
          address,
        ],
      }

      const data = await provider.send(method, params)
      setDetails(data)
      console.log(data)
    } catch (err) {
      console.log("Error: ", err)
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
      />

      <button onClick={fetchNFTCollectionDetails}>
        Fetch NFT Collection Details
      </button>

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