require('dotenv').config();
const ethers = require("ethers");
const { QUICKNODE_RPC_ENDPOINT } = process.env;

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(QUICKNODE_RPC_ENDPOINT);
  const heads = await provider.send("qn_getTransactionReceiptsByAddress", [
    {
      fromBlock: "0xee8784",
      toBlock: "0xee878e",
      accounts: ["0xa21a16ec22a940990922220e4ab5bf4c2310f556"],
      hashOnly: true,
    }
  ]);
  console.log(heads);
})();