// next/src/pages/getTokenMetadataByContractAddress.tsx

import { ethers } from "ethers"
// import { useState } from "react"
const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function GetTokenMetadataByContractAddress() {
  async function getTokenMetadataByContractAddress() {
    try {
      const method = "qn_getTokenMetadataByContractAddress"
      const params = {
        contract: "0x4d224452801ACEd8B2F0aebE155379bb5D594381",
      }

      const data = await provider.send(method, params)
      console.log(data)
    } catch (err) {
      console.log("Error: ", err)
    }
  }

  return (
    <div>
      <h2>Get Token Metadata By Contract Address</h2>

      <button onClick={getTokenMetadataByContractAddress}>
        Get Token Metadata By Contract Address
      </button>
    </div>
  )
}