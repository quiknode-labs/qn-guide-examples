# How to Create an NFT Bound Account (ERC-6551)

This project is based on the guide, [How to Create an NFT Bound Account (ERC-6551)](http://quicknode.com/guides/ethereum-development/nfts/how-to-create-and-deploy-an-erc-6551-nft).

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo, navigate to this project's directory and open the project directory in a code editor (VS code in this case).

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/ethereum/erc-6551
code .
```

Install project dependencies by running:

```sh
npm install
```

Create an **.env** file and fill in the environment variable with your private key and RPC endpoint:

```sh
RPC_URL=
PRIVATE_KEY=
```

To deploy contracts, we'll need to execute the **createAccount.js** script located in `scripts`:

```
npx hardhat run --network sepolia scripts/createAccount.js
```

To interact with your Token Bound Account, open the **interactAccount.js** file within `scripts` and replace the `nftContractAddress` and `tokenBoundAccountAddress` variables with proper values. These values were printed out in the previous script. 

Then, save the file and execute the script:

```sh
npx hardhat run --network sepolia scripts/interactAccount.js
```

Each script will output logs regarding the events that have occurred.