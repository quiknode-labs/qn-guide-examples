require('dotenv').config();
const ethers = require("ethers");

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.QUICKNODE_URL);
  const heads = await provider.send("qn_getTransfersByNFT", {
    collection: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
    collectionTokenId: "1",
    page: 1,
    perPage: 10,
  });
  console.log(heads);
})();
