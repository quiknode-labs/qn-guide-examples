# Robinhood Chain Trading Primitives (Python)

## Introduction

Runnable, **read-only** snippets for the hard parts of trading on Robinhood Chain (an EVM L2, `chainId 4663`): discovering a token's bases, getting a real [Relay](https://relay.link) route, proving sellability with a [Quicknode](https://www.quicknode.com/signup?utm_source=internal&utm_campaign=guides&utm_content=qn-rh-trader) simulation, marking a position, ingesting live signals, and discovering new pools.

Each snippet reads live mainnet, prints a real result, and **never signs or broadcasts**. Paper-first on purpose: a starter guide should not put your keys near a hot wallet. For the full walkthrough, see [our guide on Quicknode](https://www.quicknode.com/guides/robinhood/robinhood-chain-trading-primitives-with-relay).

## Features

| Snippet | What it does | Needs |
|---|---|---|
| `bases.py` | Discover the quote assets a token trades against (deepest first) | nothing; RPC optional (onchain verify) |
| `quote.py` | Get a real Relay route (approve + swap) and see the route-contract pin | nothing (Relay is keyless) |
| `sellability.py` | Prove a WETH-quoted token is sellable via a state-carrying `eth_simulateV1` (Relay route) | `QUICKNODE_RPC` |
| `mark.py` | Price a token with a live Dexscreener mark | nothing (public) |
| `signals.py` | Ingest the rhtrenches tape and gate out planted buys | nothing (public) |
| `watch.py` | Discover new v4 pools over WebSockets | `QUICKNODE_WS` |

## Prerequisites

- [Python 3.11+](https://www.python.org/downloads/)
- A Quicknode account with a [Robinhood Chain](https://www.quicknode.com/signup?utm_source=internal&utm_campaign=guides&utm_content=qn-rh-trader) endpoint (`chainId 4663`). Copy the HTTP and WSS URLs.
- No wallet and no funds. The snippets never sign.

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/quiknode-labs/qn-guide-examples.git
   ```
2. Navigate to the project directory:
   ```bash
   cd qn-guide-examples/robinhood-chain/qn-rh-trader/python
   ```
3. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. Configure your Quicknode endpoint. The snippets read `QUICKNODE_RPC` and `QUICKNODE_WS` from the environment (there is no config file and no keychain use), so export them or copy `.env.example` and source it. The endpoint carries a token, so never commit it.
   ```bash
   cp .env.example .env   # then edit .env, and: set -a; source .env; set +a
   # or export directly:
   export QUICKNODE_RPC="https://<your-endpoint>.quiknode.pro/<token>/"   # 4663 HTTP
   export QUICKNODE_WS="wss://<your-endpoint>.quiknode.pro/<token>/"      # 4663 WSS (watch.py only)
   ```

## Run

```bash
python snippets/bases.py 0x2E8c31162b855A2ffa90F6F8634643Ad6F111e18
```

See the table above for what each snippet does and which endpoint it needs. `mark.py`, `signals.py`, and `bases.py` run with no endpoint (public APIs); `bases.py` uses the RPC only for an optional onchain verify.

## Tests

```bash
pip install pytest
python -m pytest -q
```

The tests cover the snippets' offline logic (the planted-buy label gate, decimals-aware sizing, the simulation helpers, and multi-base discovery ranking). The network paths run against a live endpoint by hand, not here.

## Notes

Read-only and paper-first. Going live (signing, broadcasting, key management) is a separate build with real risk; the guide's "Going live" section lists the requirements, and this code does not implement them.

Unaudited developer example, not investment advice. Launchpad and Stock Tokens are speculative and can lose all value. Verify every pinned address against Robinhood's contract docs.

## Support & Feedback

- Repo issues: please open a GitHub issue for bugs or requests related to this example.
- Need help with Quicknode products? Reach out via support: https://support.quicknode.com/
