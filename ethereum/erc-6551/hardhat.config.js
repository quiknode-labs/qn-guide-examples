/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()
module.exports = {
  defaultNetwork: "sepolia",
  solidity: "0.8.19",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
