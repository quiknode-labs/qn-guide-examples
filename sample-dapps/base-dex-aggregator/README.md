# Base DEX Aggregator App

> **⚠️ Deprecated — reference only.**
> The **Base DeFi Power Bundle** (Gas Estimation API + OpenOcean v4 Swap API) is no longer offered by Quicknode, so this sample app can no longer be run end to end.
> The code is kept here as a reference implementation and is no longer maintained.
> Browse the [Quicknode add-ons catalog](https://www.quicknode.com/add-ons) for currently available alternatives. Token swaps on Base are now available through Quicknode's [Swap API](https://www.quicknode.com/swap-api).

A modern, user-friendly web application for performing token swaps on the Base blockchain. This web app used Quicknode’s **Base DeFi Power Bundle** to deliver **real-time gas estimation** and **optimized swap routing** — all in one modern interface.

![Base DEX Aggregator App Screenshot](./public/screenshot.png)
 
## 🚀 Features

- 🔁 **Token Swaps**: Execute token swaps on Base using the OpenOcean v4 Swap API
- ⛽ **Gas Estimation**: Real-time gas price predictions at 70%, 90%, and 99% confidence levels
- 👛 **Wallet Integration**: Easily connect wallets (MetaMask, WalletConnect, Rabby, etc.) via [connectkit](https://docs.family.co/connectkit)
 
## 🛠️ Tech Stack

| Layer     | Technology                |
| --------- | ------------------------- |
| Frontend  | React + TypeScript        |
| Web3      | Viem, Wagmi, Quicknode    |
| Wallets   | connectkit, WalletConnect |
| Styling   | Tailwind CSS              |
| API Calls | Axios                     |
| Tooling   | Vite                      |
 
## 📦 Prerequisites

Before running the app, ensure you have:

- [Node.js](https://nodejs.org/) v20.x or later
- npm, yarn, or pnpm
- A [Quicknode](https://www.quicknode.com/signup?utm_source=internal&utm_campaign=sample-apps&utm_content=base-dex-aggregator) Base endpoint with the **Base DeFi Power Bundle** enabled (_no longer available_)
- A [WalletConnect Project ID](https://cloud.walletconnect.com)
 
## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/sample-dapps/base-dex-aggregator
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment

Copy the `.env.sample` file and fill in your credentials:

```bash
cp .env.sample .env
```

```env
VITE_WALLETCONNECT_PROJECT_ID="your-walletconnect-project-id"
VITE_QUICKNODE_ENDPOINT_URL="your-quicknode-base-endpoint"
```

📌 You can get your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com).
 
## 🧪 Running the App Locally

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open your browser to: [http://localhost:5173](http://localhost:5173)
 
## 📦 Building for Production

To create an optimized build:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

To preview it locally:

```bash
npm run preview
```
 
## 🌐 Deploying to Vercel

### Quick Steps:

1. Push the project to GitHub

2. Go to [Vercel](https://vercel.com) and import the repository

3. Configure the project:

   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add environment variables:

   - `VITE_QUICKNODE_ENDPOINT_URL`
   - `VITE_WALLETCONNECT_PROJECT_ID`

5. Click **Deploy**

### Or use the Vercel CLI:

```bash
npm install -g vercel
vercel
```
 
## 🔌 API Integrations via Quicknode

This app connects to the following APIs via the Base DeFi Power Bundle:

| Feature        | API / Method                                     |
| -------------- | ------------------------------------------------ |
| Gas Estimation | `sentio_gasPrice` RPC method                     |
| Token Swaps    | OpenOcean v4 Swap API (`quote` and `swap` paths) |
 
## 🧠 How It Works

### 🟡 Gas Estimation with Sentio API

File: `src/lib/api.ts`

```ts
// Fetch gas estimates
export async function fetchGasEstimates() {
  try {
    const response = await axios.post(
      QUICKNODE_ENDPOINT_URL,
      {
        id: 1,
        jsonrpc: "2.0",
        method: "sentio_gasPrice",
        params: { chainId: BASE_CHAIN_ID },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.blockPrices[0].estimatedPrices;
  } catch (error) {
    console.error("Error fetching gas estimates:", error);
    throw error;
  }
}
```

- Fetches accurate Base gas prices
- Used in real-time to calculate transaction costs
 
### 🟢 Swapping via OpenOcean v4

File: `src/lib/api.ts`

```ts
// Fetch token list from OpenOcean API
export async function fetchTokenList(): Promise<Token[]> {
  try {
    const response = await axios.get(`${OPENOCEAN_API_URL}/tokenList`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching token list:", error);
    throw error;
  }
}

// Fetch swap quote
export async function fetchSwapQuote({
  inTokenAddress,
  outTokenAddress,
  amount,
  gasPrice,
}: {
  inTokenAddress: Address;
  outTokenAddress: Address;
  amount: string;
  gasPrice: string;
}) {
  try {
    const response = await axios.get(`${OPENOCEAN_API_URL}/quote`, {
      params: {
        inTokenAddress,
        outTokenAddress,
        amount,
        gasPrice,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching swap quote:", error);
    throw error;
  }
}

// Execute swap
export async function executeSwap({
  inTokenAddress,
  outTokenAddress,
  amount,
  slippage,
  gasPrice,
  userAddress,
}: {
  inTokenAddress: Address;
  outTokenAddress: Address;
  amount: string;
  slippage: string;
  gasPrice: string;
  userAddress: Address;
}) {
  try {
    // 1. Get the swap transaction data from OpenOcean
    const swapResponse = await axios.get(`${OPENOCEAN_API_URL}/swap`, {
      params: {
        inTokenAddress,
        outTokenAddress,
        amount,
        slippage,
        gasPrice,
        account: userAddress,
      },
    });

    const swapData = swapResponse.data.data;

    return swapData;
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
}
```

- Token list retrieval
- Quote generation
- Swap execution

All routed through the Quicknode Base endpoint.
 

## 🧭 Next Steps

Want to expand this project?

- Integrate price charts using TradingView or CoinGecko API
- Add alerts using [Quicknode Streams](https://www.quicknode.com/streams?utm_source=internal&utm_campaign=sample-apps&utm_content=base-dex-aggregator)
- Optimize UI with responsive mobile support

## 🙋 Need Help?

Join the community or reach out:

- [Discord](https://discord.gg/quicknode)
- [Twitter](https://twitter.com/Quicknode)
- [Telegram](https://t.me/quicknodehq)
