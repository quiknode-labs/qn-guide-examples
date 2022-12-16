# How to get ABI of a smart contract

This project is based on the guide, [What is an ABI?](https://www.quicknode.com/guides/smart-contract-development/what-is-an-abi?utm_source=qn-github&utm_campaign=abi&utm_content=sign-up&utm_medium=generic).

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo, navigate to this project's directory and open the project directory in a code editor (VS code in this case).

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/ethereum/abi
code .
```

Then install [solc](https://www.npmjs.com/package/solc) a Solidity compiler globally.

```bash
npm i -g solc
```
> You might need a sudo command to install the above.

Then run the following command:

```bash
solcjs test.sol --abi
```

This will create a **test_sol_test.abi** file in your directory, this file will have the contract's abi in the following format:

```
[
	{
		"inputs": [],
		"name": "getCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "increment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
```

You can also get the ABI of a smart contract from [REMIX IDE](https://remix.ethereum.org/):

![imageedit_1_8093646267](https://user-images.githubusercontent.com/41318044/204959036-2031e3c7-9037-4ca3-b730-a3cfe9484250.png)
