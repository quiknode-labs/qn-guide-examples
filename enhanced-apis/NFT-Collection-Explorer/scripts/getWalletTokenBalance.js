require('dotenv').config();
const ethers = require("ethers");

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.QUICKNODE_URL);
  provider.connection.headers = { "x-qn-api-version": 1 };
  const heads = await provider.send("qn_getWalletTokenBalance", {
    wallet: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
  });
  console.log(heads);
})();