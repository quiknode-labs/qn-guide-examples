// truffle-config.js

const HDWalletProvider = require('@truffle/hdwallet-provider')
const fs = require('fs')
const privateKey = fs.readFileSync(".secret").toString().trim()
const QUICKNODE_POLYGON_ENDPOINT = ""
const QUICKNODE_MUMBAI_ENDPOINT = ""

module.exports = {
  networks: {
    polygon: {
      provider: () => new HDWalletProvider(privateKey, QUICKNODE_POLYGON_ENDPOINT),
      network_id: 137,
      gasPrice: 40000000000,
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
    matic: {
      provider: () => new HDWalletProvider(privateKey, QUICKNODE_MUMBAI_ENDPOINT),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },
 
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.4",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    polygonscan: ''
  }
}