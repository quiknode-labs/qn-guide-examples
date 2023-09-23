/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  defaultNetwork: "sepolia",
  solidity: "0.8.19",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: "YOUR_QUICKNODE_ENDPOINT",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
