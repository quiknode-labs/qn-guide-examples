# x402 Video Paywall Demo

This project demonstrates how to implement a paywall for video content using the [x402 payment protocol](https://www.x402.org/). The web app allows users to pay a small amount of cryptocurrency (USDC) to access a paywalled video.

## Features

- Simple Express.js server with x402 payment middleware
- Paywalled endpoint for accessing premium video content
- Client-side implementation for making payments
- Base Sepolia testnet integration for easy testing

## Prerequisites

- Node.js (v22 or higher)
- A EVM-compatible wallet with Base Sepolia USDC

## Getting Started

1. Clone this repository:

   ```bash
   git clone git@github.com:quiknode-labs/qn-guide-examples.git
   cd sample-dapps/coinbase-x402
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Rename `.env.local` to `.env` and add the following variables (remember to replace `WALLET_ADDRESS` with your actual wallet address you want to receive payments for)

   ```
   WALLET_ADDRESS=your_ethereum_wallet_address
   NODE_ENV=development
   PORT=4021
   ```

4. Get Base Sepolia USDC for testing:
   - Visit https://faucet.circle.com/
   - Select Base Sepolia in the network dropdown
   - Request test USDC

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:4021`

## How It Works

1. The server uses the `x402-express` middleware to protect the `/authenticate` endpoint
2. When a user tries to access the protected endpoint, they are required to make a payment
3. After successful payment, the user is redirected to `/video-content`, where the premium video content is served

## Customizing

- To change the price of the video, modify the `price` parameter in `api/index.js`
- To use a different video, update the video source in `public/video-content.html`
- To deploy on Base mainnet, update the network configuration in `api/index.js` (you will need also need CDP API Keys and need to use a different Facilitator)
