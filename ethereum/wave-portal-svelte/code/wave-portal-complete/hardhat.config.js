require("@nomiclabs/hardhat-waffle");

const { QUICKNODE_RPC_URL, QUICKNODE_RPC_TOKEN, SEPOLIA_NODE_URL, SEPOLIA_PRIVATE_KEY, ACCOUNTS } = process.env;
const rpcUrl = QUICKNODE_RPC_URL || SEPOLIA_NODE_URL;
const signerKey = SEPOLIA_PRIVATE_KEY || ACCOUNTS;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 module.exports = {
  defaultNetwork: "hardhat",
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    ...(rpcUrl && {
      sepolia: {
        url: rpcUrl,
        httpHeaders: QUICKNODE_RPC_URL && QUICKNODE_RPC_TOKEN ? { "x-token": QUICKNODE_RPC_TOKEN } : {},
        accounts: signerKey ? [signerKey] : [],
      },
    })
  },
  solidity: "0.8.4",
};

