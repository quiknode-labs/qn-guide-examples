# Ethereum Address Appearances Application

## Introduction

This application is designed to fetch and analyze Ethereum transactions associated with a specific address, leveraging the capabilities of QuickNode's [Address Appearances API](https://marketplace.quicknode.com/add-on/address-appearances-api). It provides users with detailed comparisons of transactions found using **Address Appearances API** and Etherscan's API, offering insights into transaction history and differences between these sources.

<!-- TO-DO: ADD GUIDE URL WHEN IT'S READY -->
<!-- For an in-depth guide on how to fetch data and develop further functionalities, refer to [our comprehensive guide on QuickNode](https://www.quicknode.com/guides). -->

### Tech Stack
- Frontend Framework/Library: React
- Language: TypeScript
- Build Tool/Development Server: Vite
- Styling: Tailwind CSS

## Features

- **Transaction Comparison**: Compares transactions found using QuickNode's Address Appearances API with those found using Etherscan API.
- **Duplicate Detection**: Identifies and marks duplicate transactions of Etherscan API.
- **Filtering**: Excludes internal transactions if associated normal transactions are present.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following:
- [Node.js](https://nodejs.org/en/) installed on your system.
- A QuickNode account with the [Address Appearances API](https://marketplace.quicknode.com/add-on/address-appearances-api) enabled.
- A code editor or an IDE (e.g., [VS Code](https://code.visualstudio.com/))
- [TypeScript](https://www.typescriptlang.org/) and [ts-node](https://typestrong.org/ts-node/)

> You can run the commands below to install TypeScript and ts-node globally to have TypeScript available across all projects.

```bash
npm install -g typescript
npm install -g ts-node
```

### Installation Dependencies

1. Clone the repository to your local machine:
```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
```

2. Navigate to the project directory:
```bash
cd sample-dapps/ethereum-address-appearances
```

3. Install the necessary dependencies:
```bash
npm install
```

### Setting Environment Variables

Rename `.env.example` to `.env` and replace the `YOUR_QUICKNODE_ETHEREUM_ENDPOINT_URL` and `YOUR_ETHERSCAN_API_KEY` placeholders with your QuickNode Ethereum Node Endpoint and Etherscan API key. Make sure that the [Address Appearances API](https://marketplace.quicknode.com/add-on/address-appearances-api) is enabled.

```env
VITE_QUICKNODE_ENDPOINT = "YOUR_QUICKNODE_ETHEREUM_ENDPOINT_URL"
```

> Please note that while we utilize `dotenv` for environment variable management, sensitive information like endpoints can still be visible on the frontend. This configuration is not recommended for production environments as-is.

### Running the Application

Run the development server:

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) with your browser to see the application.

## Using the App
1. Input an Ethereum address.
2. Press Generate.
3. View the comparison of transactions found by QuickNode's Address Appearances API and Etherscan API.
4. Review the transaction summary and detailed comparison table.

The **Ethereum Address Appearances Application** will query the Ethereum blockchain for the address's transactions, compare the data from QuickNode and Etherscan, and display the results.

![Preview](public/image.png)

## Conclusion

QuickNode's [Address Appearances API](https://marketplace.quicknode.com/add-on/address-appearances-api) excels in identifying more transaction appearances compared to other sources. This enhanced capability provides developers and businesses with more comprehensive and accurate transaction data. By leveraging this API, users can gain deeper insights into blockchain interactions. 

Whether for audit purposes, regulatory compliance, or market analysis, QuickNode's Address Appearances API ensures you have the most detailed and accurate transaction data available. To discover more about how QuickNode assists companies and individuals in extracting comprehensive blockchain data, please [contact us](https://www.quicknode.com/contact-us); we're eager to engage with you!