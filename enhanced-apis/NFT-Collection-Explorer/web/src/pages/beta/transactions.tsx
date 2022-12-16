// next/src/pages/getWalletTokenTransactions.tsx

import { ethers } from "ethers"
// import { useState } from "react"
const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_QN_URL)

export default function GetWalletTokenTransactions() {
  async function getWalletTokenTransactions() {
    try {
      const method = "qn_getWalletTokenTransactions"
      const params = [{
        address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        contract: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
        page: 1,
        perPage: 10,
      }]

      const data = await provider.send(method, params)
      console.log(data)
    } catch (err) {
      console.log("Error: ", err)
    }
  }

  return (
    <div>
      <h2>Get Wallet Token Transactions</h2>
      
      <button onClick={getWalletTokenTransactions}>
        Get Wallet Token Transactions
      </button>
    </div>
  )
}