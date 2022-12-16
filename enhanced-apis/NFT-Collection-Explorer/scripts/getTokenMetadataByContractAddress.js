require('dotenv').config();
const ethers = require("ethers");

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.QUICKNODE_URL);
  const heads = await provider.send("qn_getTokenMetadataByContractAddress", {
    contract: "0x4d224452801ACEd8B2F0aebE155379bb5D594381",
  });
  console.log(heads);
})();