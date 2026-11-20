Repository for the guide Written by @Nazeeh21 -- https://www.quicknode.com/guides/ethereum-development/smart-contracts/integrate-your-svelte-app-with-a-smart-contract

## Sepolia RPC

For Sepolia deployment from `code/wave-portal-complete`, export `QUICKNODE_RPC_URL` with the endpoint Base URL, `QUICKNODE_RPC_TOKEN` with its Auth token, and `SEPOLIA_PRIVATE_KEY` with your test wallet key. A full HTTPS endpoint URL works with the RPC token unset. The Svelte frontend uses the connected browser wallet.

> [!NOTE]
> We recommend sending the **Auth token** in the `x-token` header for HTTPS requests. This reduces the risk of exposing credentials through URL logging and monitoring systems.
>
> Quicknode supports both header and URL-path authentication. Open **How to authenticate** on your endpoint overview to see the HTTPS examples.

Existing setups can keep using `SEPOLIA_NODE_URL` and `ACCOUNTS`.
