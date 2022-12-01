const Web3 = require("web3")
const provider = "<YOUR_QUICKNODE_HTTP_PROVIDER_HERE>"
const Web3Client = new Web3(new Web3.providers.HttpProvider(provider))

const minABI = [  
  {    
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
]

const tokenAddress = "0x0d8775f648430679a709e98d2b0cb6250d2887ef"
const walletAddress = "0x1cf56Fd8e1567f8d663e54050d7e44643aF970Ce"

const contract = new Web3Client.eth.Contract(minABI, tokenAddress)

async function getBalance() {
  const result = await contract.methods.balanceOf(walletAddress).call() // 29803630997051883414242659
  const format = Web3Client.utils.fromWei(result) // 29803630.997051883414242659
  console.log(format)
}

getBalance()