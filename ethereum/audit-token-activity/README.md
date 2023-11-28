# Audit ERC20, ERC721, and ERC1155 Token Activity using QuickNode SDK

This project is based on the guide, [How to Audit ERC20, ERC721, and ERC1155 Token Activity using QuickNode SDK](https://www.quicknode.com/guides/ethereum-development/transactions/how-to-audit-token-activity-using-quicknode-sdk) by Sergen Uysal. Using JavaScript and the QuickNode SDK, this tool fetches and analyzes transactions across ERC20, ERC721, and ERC1155 token standards to conducting comprehensive audits on blockchain wallets, specifically tailored for EVM-compatible chains.

### Prerequisites

- A [QuickNode account](https://www.quicknode.com/?utm_source=qn-github&utm_campaign=explorer&utm_content=sign-up&utm_medium=generic).
- [Node.JS](https://nodejs.org/en/) installed.

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo, navigate to this project's directory, install dependencies, and open the project directory in a code editor.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/ethereum/audit-token-activity
npm install
```

## Running the Code

### Configuring the Endpoint

1. Obtain a QuickNode endpoint URL for the EVM chain that you want.
2. Open the `index.js` file.
3. Locate the `Core` object instantiation. It should look like this:

```javascript
const core = new Core({
  endpointUrl: "QUICKNODE_ENDPOINT",
});
```
4. Replace `QUICKNODE_ENDPOINT` with your actual QuickNode endpoint URL.

### Audit Configuration

At the end of the `index.js` file, you will find the `run` function call. This function accepts four parameters:

- **Addresses**: An array of wallet addresses you wish to audit.
- **FromBlock**: The starting block number for the audit range.
- **ToBlock**: The ending block number for the audit range.
- **TokenTypes**: An array of token standards (e.g., 'ERC20', 'ERC721') to include in the audit.

### Example Usage

The file contains a pre-configured example that audits a specific address for both ERC20 and ERC721 token transfers:

```javascript
run(['0xe2233D97f30745fa5f15761B81B281BE5959dB5C'], 38063215, 38063220, ['ERC20', 'ERC721']);
```

Feel free to modify this example with your desired parameters.

### Executing the Script

1. Open your terminal.
2. Navigate to the directory containing your `index.js` file.
3. Run the script using Node.js:

```sh
node index.js
```

### Output

Upon successful execution, the script will generate a `wallet_audit_data.json` file in the same directory. This file contains a detailed account of the wallet's transactions, including token transfers and internal transactions, within the specified block range.

## Support

For additional assistance or queries regarding the setup and usage, feel free to reach out to us by using the feedback form in the [Conclusion section of the guide](https://www.quicknode.com/guides/ethereum-development/transactions/how-to-audit-token-activity-using-quicknode-sdk#conclusion).