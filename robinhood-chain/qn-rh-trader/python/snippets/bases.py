"""Discover what a Robinhood Chain token trades against. Read-only.

A single token trades across MANY LPs with different quote/settlement assets: a long.xyz
token like $AI has WETH, USDG, native-ETH, and a Stock-Token (e.g. NVDA) pool at once. This
leads with the PRIMARY (deepest) base and lists the others.

It matters less than it looks for execution: Relay routes swap SETTLEMENT for you, so the
base is mainly informational - what to price and probe against. Discovery is keyless
(Dexscreener /token-pairs/v1). If QUICKNODE_RPC is set, the primary base is also verified
onchain (real contract + decimals), because Dexscreener's per-pool liquidity can be off.

    python snippets/bases.py 0x2E8c31162b855A2ffa90F6F8634643Ad6F111e18
    QUICKNODE_RPC=https://... python snippets/bases.py 0x...    # + onchain verify
"""

from __future__ import annotations

import sys

from common import CHAIN_ID, discover_quotes, verify_quote_onchain


def _liq(q) -> str:
    return f"${q['liq_usd']:,.0f}" if isinstance(q["liq_usd"], (int, float)) else "n/a"


def main(token: str) -> None:
    quotes = discover_quotes(token)
    if not quotes:
        print(f"{token}: no Dexscreener pairs (unindexed or unlaunched)")
        return

    primary = quotes[0]
    v = verify_quote_onchain(primary["address"])
    if v is None:
        tag = "(set QUICKNODE_RPC to verify onchain)"
    elif not v.get("chain_ok"):
        tag = f"[WARNING: endpoint reports chain {v.get('chain')}, not {CHAIN_ID}]"
    elif v.get("native"):
        tag = "[native ETH, 18 dp]"
    elif v.get("code") and v.get("decimals") is not None:
        tag = f"[verified onchain, {v['decimals']} dp]"
    elif v.get("code"):
        tag = "[code present on 4663; decimals unverified]"
    else:
        tag = "[WARNING: no contract code on 4663 - phantom listing?]"

    print(token)
    print(f"  PRIMARY  {(primary['symbol'] or primary['address']):8} {primary['address']}")
    print(f"           liq {_liq(primary)} (Dexscreener)  {tag}")
    if len(quotes) > 1:
        print("  others   (observed counterpart assets; Relay route support unverified):")
        for q in quotes[1:]:
            print(f"           {(q['symbol'] or q['address']):8} {q['address']}  liq {_liq(q)}")
    print("  note     these are Dexscreener pairs, not confirmed routes. Relay picks the actual")
    print("           settlement path, so the base is informational. Confirm a base with quote.py.")
    print("           the liq shown is the DIRECT pair only; it can badly UNDERSTATE tradeable depth")
    print("           because Relay routes through deeper pools (a thin direct pair still trades big),")
    print("           and some counterparts (e.g. Stock Tokens) may not be Relay-routable at all.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: python snippets/bases.py <token-address>")
    main(sys.argv[1])
