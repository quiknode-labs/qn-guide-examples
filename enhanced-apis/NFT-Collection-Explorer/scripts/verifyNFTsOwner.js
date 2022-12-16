require('dotenv').config();
const ethers = require("ethers");

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.QUICKNODE_URL);
  provider.connection.headers = { "x-qn-api-version": 1 };
  const heads = await provider.send("qn_verifyNFTsOwner", [
    "0x91b51c173a4bdaa1a60e234fc3f705a16d228740",
    [
      "0x2106c00ac7da0a3430ae667879139e832307aeaa:3643",
      "0xd07dc4262bcdbf85190c01c996b4c06a461d2430:133803",
    ],
  ]);
  console.log(heads);
})();
