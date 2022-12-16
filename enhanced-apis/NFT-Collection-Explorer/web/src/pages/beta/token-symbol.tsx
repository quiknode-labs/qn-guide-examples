// next/src/pages/getTokenMetadataBySymbol.tsx

import { ethers } from "ethers"
// import { useState } from "react"
const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function GetTokenMetadataBySymbol() {
  async function getTokenMetadataBySymbol() {
    try {
      const method = "qn_getTokenMetadataBySymbol"
      const params = {
        symbol: "USDC",
      }

      const data = await provider.send(method, params)
      console.log(data)
    } catch (err) {
      console.log("Error: ", err)
    }
  }

  return (
    <div>
      <h2>Get Token Metadata By Symbol</h2>

      <button onClick={getTokenMetadataBySymbol}>
        Get Token Metadata By Symbol
      </button>
    </div>
  )
}