Check out our Guides for more information on how to use the Solana Pay: 

- [Getting Started with Solana Pay](https://www.quicknode.com/guides/solana-development/solana-pay/getting-started-with-solana-pay/)

- [How to Build a Payment Portal with Solana Pay in Your Web App](https://www.quicknode.com/guides/solana-development/solana-pay/add-solana-pay-to-your-web-app/)
    - [Front End Source Code](./payment-portal/index.tsx)
    - [Back End Source Code](./payment-portal/pay.ts)

- [Beyond Pay - Using Solana Pay with Custom Solana Programs](https://www.quicknode.com/guides/solana-development/solana-pay/beyond-pay-custom-programs)
    - [Front End Source Code](./custom-program-implementation/index.tsx)
    - [Back End Source Code](./custom-program-implementation/pay.ts)


For the payment portal and custom program examples, set `QUICKNODE_RPC_URL` and `QUICKNODE_RPC_TOKEN` in the Next.js server environment. Set the token only when the URL contains the endpoint’s Base URL. A full authenticated URL works with the separate token unset. The custom program page reads the counter through the same-origin payment API.
