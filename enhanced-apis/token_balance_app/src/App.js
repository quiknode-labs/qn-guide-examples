//src/App.js
//Import libraries and components
import { useState } from 'react';
import { ethers, utils } from "ethers";


function App() {
  //State variables
  const [tokens, setTokens] = useState([])
  const [address, setAddress] = useState('')

  //Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setAddress(address);
    fetchTokens() 
    .then(data => {
      setTokens(data.assets)
    })
    .catch(err => setTokens([]))
  }

  //Function to fetch tokens
  const fetchTokens = async () => {
    if (!utils.isAddress(address)){
      alert('Please enter a valid Ethereum wallet address')
      return;
    }
    const provider = new ethers.providers.JsonRpcProvider("<YOUR-QUICKNODE-HTTP-URL-HERE>");
    const tokens = await provider.send("qn_getWalletTokenBalance", {
      wallet: address,
      contracts: [
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //WETH
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', //USDT
        '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', //MATIC
        '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72', //ENS
      ]
    });
    return tokens
  }
  
  return(
    <div className="h-screen w-screen justify-center space-x-3">  
      <div className="flex justify-center space-x-3 w-screen h-14 mt-10">
        <form 
            onSubmit={handleSubmit}
            className="w-4/12 h-15 relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 dark:border-gray-700 dark:bg-gray-800"> 
            <input
                onChange={e => setAddress(e.target.value)}
                type="text"
                placeholder="Enter your Address here 🎯"
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
            <button
            type='submit'
            className="rounded-lg top-1 right-1 bottom-1 border absolute w-12 justify-center bg-blue-400 text-white p-3 font-bold uppercase"
            >
            GO
            </button>
        </form>
      </div>
      <div className="relative top-4/12 left-1/4 overflow-x-auto justify-center space-x-3 w-6/12 h-140 m-10">
        <table className="min-w-full divide-y-2 divide-gray-200 text-sm">
          <thead>
            <tr>
              <th
                className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-1000">
                Name
              </th>
              <th
                className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">
                Symbol
              </th>
              <th
                className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tokens.map((token, index) => (
              <tr key={index}>
                <td className="whitespace-nowrap px-4 py-2 text-gray-900">{token.name}</td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-900">{token.symbol}</td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-900">{utils.formatUnits(token.amount, token.decimals)}</td>
              </tr>
            ))}  
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;