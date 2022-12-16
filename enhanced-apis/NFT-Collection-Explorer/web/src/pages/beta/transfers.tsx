// next/src/pages/getTransfersByNFT.tsx

import { ethers } from "ethers"
// import { useState } from "react"
const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function GetTransfersByNFT() {
  async function getTransfersByNFT() {
    try {
      const method = "qn_getTransfersByNFT"
      const params = {
        collection: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
        collectionTokenId: "1",
        page: 1,
        perPage: 10,
      }

      const data = await provider.send(method, params)
      console.log(data)
    } catch (err) {
      console.log("Error: ", err)
    }
  }

  return (
    <div>
      <h2>Get Transfers By NFT</h2>
      
      <button onClick={getTransfersByNFT}>
        Get Transfers By NFT
      </button>
    </div>
  )
}