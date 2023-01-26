## STEPS 
- [Need Solana CLI installed](https://docs.solana.com/cli/install-solana-cli-tools)
- [Download and Install Sugar (CMV3)](https://docs.metaplex.com/developer-tools/sugar/guides/sugar-for-cmv3)
- Set keypair (-k) and RPC (-u) in Solana CLI (`solana config set ...`)
- [Config Candy Machine wihtout Candy Guards](./config.json)
- [Upload Assets](./assets/) (`sugar validate` -> `sugar upload`)
- Deploy Candy Machine (`sugar deploy`)
- Add Candy Guard (see below) (`sugar guard add`)
- Fork Solana Scaffold (`gh repo clone solana-labs/dapp-scaffold .`)
- Add dependencies (`yarn add @metaplex-foundation/js @solana/spl-token env`)
- Update `next.config.js` ([link](./next.config.js))
- Update .env
- Update [Mint Button](./onClick.ts)


### Candy Guard
```json
    "default": {
      "tokenBurn":{
        "amount": 100000,
        "mint": "bonkKjzREa7pVBRD6nFPAKRaHhS7XpDhhgZCZdGNkuU"
      }
    }
```

## RESOURCES

- https://www.quicknode.com/guides/solana-development/how-to-create-a-solana-nft-collection-using-candy-machine-v3-and-typescript
- https://www.quicknode.com/guides/solana-development/how-to-deploy-an-nft-collection-on-solana-using-sugar-candy-machine
- https://www.quicknode.com/guides/solana-development/how-to-connect-users-to-your-dapp-with-the-solana-wallet-adapter-and-scaffold 
- https://github.com/metaplex-foundation/sugar/releases 

### BONK MAINNET 

BONK_MINT = `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
BONK_DECIMALS = `5`
ONE_BONK = `100000` // 1e5 b/c 5 decimals

## BONK DEVNET (user-created example)
*[create your own fungible token](https://www.quicknode.com/guides/solana-development/how-to-create-a-fungible-spl-token-with-the-new-metaplex-token-standard)*

BONK_MINT = `bonkKjzREa7pVBRD6nFPAKRaHhS7XpDhhgZCZdGNkuU`
BONK_DECIMALS = `5`
ONE_BONK = `100000` // 1e5 b/c 5 decimals
CANDY_MACHINE_ID = `ARH5Dx3DYJ1qisBzJWubuhehLaPDA3PiSS2Piv6CQvgj`
