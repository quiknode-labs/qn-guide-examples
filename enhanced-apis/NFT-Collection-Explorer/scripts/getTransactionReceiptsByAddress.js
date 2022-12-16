require('dotenv').config();
const ethers = require("ethers");

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.QUICKNODE_URL);
  const receipts = await provider.send("qn_getTransactionReceiptsByAddress", [
    {
      "fromBlock": "0xe1b402",
      "toBlock": "0xee878e",
      "fromAddresses": ["0xa21a16ec22a940990922220e4ab5bf4c2310f556"],
      "toAddresses": ["0x9d7d561bd58a78a5cd033ef10ed8c18364e5e194"],
      "accounts": ["0x9d7d561bd58a78a5cd033ef10ed8c18364e5e194"],
      "ordering": "asc",
      "page": 0,
      "hashOnly": false,
    },
  ]);
  console.log(receipts);
})();
