require("dotenv").config();
const ethers = require("ethers")
const express = require("express");
const { TwitterApi } = require("twitter-api-v2");

const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
});

const twitterClient = client.readWrite;

const app = express();
app.use(express.json());

const { PORT } = process.env

let types = ['uint256', 'address'];

async function tweet(message) {
  try {
    await twitterClient.v2.tweet(message);
  } catch (e) {
    console.log(e)
  }

}

app.post('/webhook', async (req, res) => {
  const webhook = req.body;
  for (let i = 0; i < webhook.length; i++) {
    console.log(webhook[i])
    const block = webhook[i].blockNumber
    const txHash = webhook[i].transactionHash
    const data = ethers.utils.defaultAbiCoder.decode(types, webhook[i].logs[0].data)
    const poolAddress = data[1]

  const message = `
  This Tweet was Generated with QuickAlerts!
  New Liquidity Pool found on Uniswap V3 Detected!
  More info: https://www.dextools.io/app/en/ether/pair-explorer/${poolAddress}
  Powered by @QuickNode
  `

  await tweet(message)
  res.sendStatus(200);
  }
});


app.listen(PORT, () => {
  console.log(`Express server is listening on PORT ${PORT}...`);
});

