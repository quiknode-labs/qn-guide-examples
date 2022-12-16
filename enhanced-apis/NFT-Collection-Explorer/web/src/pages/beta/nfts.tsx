// next/src/pages/

import { ethers } from "ethers"
// import { useState } from "react"
const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function FetchNFTs() {
  async function fetchNFTs() {
    try {
      const method = "qn_fetchNFTs"
      const params = {
        wallet: "0x91b51c173a4bdaa1a60e234fc3f705a16d228740",
        omitFields: ["provenance", "traits"],
        page: 1,
        perPage: 10,
        contracts: [
          "0x2106c00ac7da0a3430ae667879139e832307aeaa",
          "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
        ],
      }

      const data = await provider.send(method, params)
      console.log(data)
    } catch (err) {
      console.log("Error: ", err)
    }
  }

  return (
    <div>
      <h2>Fetch NFTs</h2>

      <button onClick={fetchNFTs}>
        Fetch NFTs
      </button>
    </div>
  )
}