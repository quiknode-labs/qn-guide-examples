require('dotenv').config();
const ethers = require("ethers");

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.QUICKNODE_URL);
  const heads = await provider.send("qn_getWalletTokenTransactions", {
    address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    contract: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    page: 1,
    perPage: 10,
  });
  console.log(heads);
})();
