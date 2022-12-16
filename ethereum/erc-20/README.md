# Create and Deploy an ERC20 Token

This project is based on the guide, [How to create and deploy an ERC20 token](https://www.quicknode.com/guides/smart-contract-development/how-to-create-and-deploy-an-erc20-token?utm_source=githubscaffolds&utm_campaign=erc20?utm_source=qn-github&utm_campaign=erc20&utm_content=sign-up&utm_medium=generic).

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo, navigate to this project's directory and open the project directory in a code editor (VS code in this case).

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/ethereum/erc-20
code .
```

There are 2 ways we have demonstrated here to deploy an ERC20 token: 
### 1️⃣ By inheriting the ERC20 interface and creating our own contract, for this use the file **erc20_without_library.sol**

In this method replace `YOUR_METAMASK_WALLET_ADDRESS` on [line 66](https://github.com/quiknode-labs/qn-guide-examples/blob/main/ethereum/erc-20/erc20_without_library.sol#L66) and [line 67](https://github.com/quiknode-labs/qn-guide-examples/blob/main/ethereum/erc-20/erc20_without_library.sol#L67).

Then create a new file in [REMIX IDE](https://remix.ethereum.org/) and deploy your contract using injected provider on Goerli testnet. If you need some Goerli testnet ETH you can get it from [QuickNode faucet](https://faucet.quicknode.com?utm_source=githubscaffolds&utm_campaign=erc20).

> Make sure to set the compiler version to `0.4.24`

### 2️⃣ By using [OpenZepplin](https://docs.openzeppelin.com/contracts/4.x/) contract library, for this use the file **erc20_with_library.sol**

In this method we can deploy the contract using [REMIX IDE's](https://remix.ethereum.org/) injected provider on Goerli testnet. 

You can change the token name and symbol based on your liking.
