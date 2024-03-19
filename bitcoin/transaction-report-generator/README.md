# Bitcoin Transaction Report Generator

## Introduction

This script is designed to fetch and analyze Bitcoin transactions associated with a specific address, utilizing the power of QuickNode's Blockbook RPC add-on. It generates detailed reports within a specified date range, providing insights into transaction history, balances after each transaction, and the USD value of Bitcoin movements. Aimed at developers, financial analysts, and enthusiasts, this tool ensures clarity and compliance in managing Bitcoin transaction data.

For an in-depth guide on how to use and develop this tool, refer to [our comprehensive guide on QuickNode](https://www.quicknode.com/guides/quicknode-products/marketplace/how-to-generate-bitcoin-transaction-reports-with-blockbook).

## Language Support

The Bitcoin Transaction Report Generator is available in two programming languages to cater to a wider range of users and use cases:

- **TypeScript**: For those who prefer working in a Node.js environment and appreciate the benefits of type safety and modern JavaScript features.
- **Python**: Offering a Pythonic approach for users who are more comfortable with Python's syntax and its rich ecosystem for data analysis and scripting.

Each implementation has its own directory:

- [TypeScript Version](./typescript/)
- [Python Version](./python/)

Please navigate to the respective directory for detailed instructions on setting up and using the version that best suits your needs.

## Features
- **Balance Calculation**: Calculates the BTC balance before and after each transaction.
- **Transaction Direction**: Identifies whether transactions are incoming or outgoing.
- **Confirmation Status**: Determines whether transactions are confirmed.
- **USD Conversion**: Computes the USD value of each transaction at the time it occurred.
- **Transaction Filtering**: Excludes internal wallet transactions that are not relevant to the address in question.
- **Date Range Filtering**: Generates reports for transactions within a specified date range.


## Getting Started

Please refer to the README file within the directory of the language version you choose to use for detailed setup instructions and usage guidelines.

We hope this tool enhances your ability to analyze Bitcoin transactions effectively. For feedback, contributions, or issues, please open an issue or pull request in this repository.

## Output

The script generates a CSV file in the current directory with a name of the format It creates a file with a name of the format `transaction_report_{address}_{start_date}_{end_date}.csv`. This CSV file contains detailed information on each transaction, including but not limited to the transaction date, the amount in BTC and USD, and the balance after each transaction, all tailored according to the specified parameters.

## Conclusion

[QuickNode's Blockbook add-on](https://marketplace.quicknode.com/add-on/blockbook-rpc-add-on) makes it easier for developers and businesses to create detailed Bitcoin transaction reports. This script introduces the basics, but there's more you can do. Whether it's for audits, helping with regulatory tasks, or market analysis, the Blockbook add-on simplifies the blockchain data extraction process.

To learn more about how QuickNode is helping auditing firms to pull this type of data from blockchains, please feel free to [reach out to us](https://www.quicknode.com/contact-us); we would love to talk to you!

