# RWA Tokenizer v2 - Project Structure

## Directory Layout

```
rwa-tokenizer-v2/
├── contracts/               # Smart contracts
│   ├── interfaces/         # Contract interfaces
│   │   ├── IONFT721.sol           # LayerZero ONFT v2 interface
│   │   ├── IPermit2.sol           # Uniswap Permit2 interface
│   │   ├── IERC20.sol             # Standard ERC20 interface
│   │   ├── ICCTPScaffold.sol      # Circle CCTP scaffold
│   │   └── ILayerZeroEndpoint.sol # LayerZero endpoint interface
│   ├── libraries/          # Shared libraries
│   │   ├── Errors.sol             # Custom error definitions
│   │   └── Types.sol              # Shared type definitions
│   ├── Config.sol                 # Chain configuration constants
│   ├── RWA721ONFT.sol            # Main RWA NFT contract
│
├── script/                  # Deployment scripts
│   ├── DeployRWA.s.sol           # Deploy RWA721ONFT
│   └── WireONFT.s.sol            # Wire cross-chain trust
│
├── test/                    # Foundry tests
│   ├── RWA.t.sol                 # RWA721ONFT tests
│   └── BridgeStub.t.sol          # Bridge simulation tests
│
├── foundry.toml             # Foundry configuration
├── remappings.txt           # Import remappings
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── install.sh               # Dependency installation script
├── README.md                # Main documentation
└── PROJECT_STRUCTURE.md     # This file
```
