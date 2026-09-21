# Robinhood Chain Trading Primitives

## Introduction

Read-only, paper-first primitives for the hard parts of trading on Robinhood Chain (an EVM L2, `chainId 4663`): discovering a token's quote assets, getting a real [Relay](https://relay.link) route, proving a token is sellable with a [Quicknode](https://www.quicknode.com/signup?utm_source=internal&utm_campaign=guides&utm_content=qn-rh-trader) simulation, marking a position, ingesting a live trade tape, and discovering brand-new pools. Every snippet reads live mainnet, prints a real result, and never signs or broadcasts.

For the full walkthrough, see [our guide on Quicknode](https://www.quicknode.com/guides/robinhood/robinhood-chain-trading-primitives-with-relay).

## Language Support

- [Python Version](./python/)

## Features

- **Base discovery** — the quote assets a token actually trades against, deepest first.
- **Real routing** — a live Relay route (approve + swap) with the route contract pinned.
- **Sellability proof** — a state-carrying `eth_simulateV1` that proves a token can be sold, not just bought.
- **Live marking** — a current price from a public Dexscreener feed.
- **Signal ingestion** — a live trade tape with a fail-closed gate against planted buys.
- **New-pool discovery** — a WebSocket feed of brand-new Uniswap v4 pools as they are created.

## Getting Started

Refer to the [Python](./python/) directory's README for setup and usage.
