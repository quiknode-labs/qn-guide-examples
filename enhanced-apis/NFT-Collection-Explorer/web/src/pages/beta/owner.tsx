// next/src/pages/verifyNFTsOwner.tsx

import { ethers } from "ethers"
// import { useState } from "react"
const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function VerifyNFTsOwner() {
  async function verifyNFTsOwner() {
    try {
      const method = "qn_verifyNFTsOwner"
      const params = [
        "0x91b51c173a4bdaa1a60e234fc3f705a16d228740",
        [
          "0x2106c00ac7da0a3430ae667879139e832307aeaa:3643",
          "0xd07dc4262bcdbf85190c01c996b4c06a461d2430:133803",
        ],
      ]
      
      const data = await provider.send(method, params)
      console.log(data)
    } catch (err) {
      console.log("Error: ", err)
    }
  }

  return (
    <div>
      <h2>Verify NFTs Owner</h2>

      <button onClick={verifyNFTsOwner}>
        Verify NFTs Owner
      </button>
    </div>
  )
}