# Solana Mobile App

This project demonstrates how to build a React Native Android appl that integrates with Solana wallets using the Mobile Wallet Adapter.

This sample project is the companion code for the Quicknode guide [Build a Solana Mobile App on Android with React Native](https://www.quicknode.com/guides/solana-development/dapps/build-a-solana-mobile-app-on-android-with-react-native)

The app shows how to:

- Connect/Disconnect a Solana wallet via Mobile Wallet Adapter (MWA)
- Display SOL balance
- Request devnet airdrops
- Send SOL transfers
- Use `@solana/kit` in a React Native / Expo Android app  

## Project Setup

1. **Clone Example Monorepo**

To begin, clone the `qn-guide-examples` repo and navigate to this project's directory.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/solana/solana-mobile-app
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Solana RPC**

   Edit `app/constants/index.ts` and set `SOLANA_RPC_URL` to your Quicknode (or devnet) endpoint. You can get a free endpoint [here](https://www.quicknode.com/signup).

4. **Run the app on Android**

   ```bash
   npm run android
   ```

   Make sure:

   * Your Android emulator or device is running
   * A Solana-compatible mobile wallet (or [Mock MWA wallet](https://github.com/solana-mobile/mock-mwa-wallet)) is installed


## Learn More

For step-by-step instructions and detailed explanations, including environment setup and code walkthrough, follow the guide:

[https://www.quicknode.com/guides/solana-development/dapps/build-a-solana-mobile-app-on-android-with-react-native](https://www.quicknode.com/guides/solana-development/dapps/build-a-solana-mobile-app-on-android-with-react-native)

