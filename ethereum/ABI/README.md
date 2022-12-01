# How to get ABI of a smart contract

This project is based on the guide, [What is an ABI?](https://www.quicknode.com/guides/smart-contract-development/what-is-an-abi).

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

This will create a **test_sol_test.abi** file in your directory, this file will have the contract's abi in JSON format.