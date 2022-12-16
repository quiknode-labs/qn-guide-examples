require('dotenv').config();
const ethers = require("ethers");

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.QUICKNODE_URL);
  const heads = await provider.send("qn_getTokenMetadataBySymbol", {
    symbol: "USDC",
  });
  console.log(heads);
})();
