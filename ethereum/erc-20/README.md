# Create and Deploy an ERC20 Token

This project is based on the guide, [How to create and deploy an ERC20 token](https://www.quicknode.com/guides/smart-contract-development/how-to-create-and-deploy-an-erc20-token?utm_source=githubscaffolds&utm_campaign=erc20).

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo, navigate to this project's directory and open the project directory in a code editor (VS code in this case).

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/ethereum/erc-20
code .
```

There are 2 ways we have demonstrated here to deploy an ERC20 token: 
1. By inheriting the ERC20 interface and creating our own contract for this use the file **erc20_without_library.sol**

In this method replace `YOUR_METAMASK_WALLET_ADDRESS` on Line
