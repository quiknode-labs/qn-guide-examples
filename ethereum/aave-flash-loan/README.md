# Make a Flash Loan using Aave V3

This project is based on the guide, [How to Make a Flash Loan using Aave](https://www.quicknode.com/guides/defi/how-to-make-a-flash-loan-using-aave?utm_source=qn-github&utm_campaign=flash_loan&utm_content=sign-up&utm_medium=generic), follow the guide to understand how the smart contract works.

#### Prerequisites
- [MetaMask](https://metamask.io/) installed.
- [QuickNode Polygon Mumbai Testnet endpoint](https://www.quicknode.com/?utm_source=qn-github&utm_campaign=aave_flash_loan&utm_content=sign-up&utm_medium=generic) added to MetaMask.
- [REMIX IDE](https://remix.ethereum.org/)

---
### Step 1️⃣ - Adding the smart contract to REMIX IDE.

Copy the [FlashLoan.sol](https://github.com/quiknode-labs/qn-guide-examples/blob/main/ethereum/aave-flash-loan/FlashLoan.sol) file, create a new file with same name in REMIX IDE.

---
### Step 2️⃣ - Deploying the smart contract.

Deploy the contract with `PoolAddressesProvider-Polygon` value from [Aave docs](https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses) as parameter.

![2](https://user-images.githubusercontent.com/41318044/221353771-f2ea1233-ca98-46cb-b087-bdb340d72db4.png)
![3](https://user-images.githubusercontent.com/41318044/221353772-7fa5c127-f64a-432e-ba92-12092fe8b2bb.png)

---
### Step 3️⃣ - Funding the Flash loan. 

We will perform a flash loan to get USDC on Polygon Mumbai Testnet. But first our contract will need some USDC on Polygon Mumbai Testnet to pay as interest fee.
Get some Polygon Mumbai Testnet USDC from [Aave faucet](https://staging.aave.com/faucet/). Connect your wallet, select Polygon Market and Faucet some USDC,

![5](https://user-images.githubusercontent.com/41318044/221354039-ccac56c9-c4fa-4ff1-8955-e91877309d9c.png)

After receiving the USDC send some to the deployed smart contract, this USDC in your contract will be used to pay the interest fee.

---
### Step 4️⃣ - Perform the Flash loan.

Go to [Aave V3 doc's Testnet Addresses page](https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses), select Polygon Mumbai, and copy the address of USDC reserve.

![6](https://user-images.githubusercontent.com/41318044/221354212-922675fb-b725-4496-831e-84b819d30b63.png)

Go back to your REMIX IDE tab then expand the smart contract under the Deployed Contracts section and expand the **fn_RequestFlashLoan** function button. Paste the USDC reserve’s address in the **_token** field and enter the amount of USDC to be borrowed (10 in this case) in the **_amount** field. When entering the number of ERC20 tokens in Solidity, we also need to mention the decimals of that ERC20 token. The decimals of USDC is six, so 10 USDC will be 10000000. Click the **transact** button.

![7](https://user-images.githubusercontent.com/41318044/221354253-d651e5e0-8f49-4be4-a5d0-98dcfb08f463.png)

Copy the transaction hash and check it on on [Mumbai Polygonscan](https://mumbai.polygonscan.com/). It will look like this🔽

![8](https://user-images.githubusercontent.com/41318044/221354364-bb219ed0-1a39-4f38-80df-fa80d2a8581f.png)

You have successfully performed a Flash loan using Aave V3
