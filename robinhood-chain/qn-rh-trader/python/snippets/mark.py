"""Mark a Robinhood Chain token with a live Dexscreener price. Read-only, keyless.

Dexscreener indexes Robinhood Chain under the SLUG "robinhood" (the numeric 4663 returns []).
Two traps this handles: priceUsd is a STRING (never re-round it), and pairCreatedAt is in
MILLISECONDS. The price is an external estimate, not an audited mark.

    python snippets/mark.py 0x2E8c31162b855A2ffa90F6F8634643Ad6F111e18
"""

from __future__ import annotations

import sys

from common import checksum, dex_pairs


def mark(token: str) -> None:
    token = checksum(token)
    pairs = dex_pairs(token)               # all of the token's pools (see common.dex_pairs)
    if not pairs:
        print(f"{token}: no Dexscreener pair (n/a)")
        return

    # Keep only pairs where THIS token is the base, then take the deepest by USD liquidity.
    # Do NOT fall back to a QUOTE-side pair: its priceUsd is the OTHER token's price, so
    # printing it under this address would be wrong.
    ours = [p for p in pairs
            if (p.get("baseToken") or {}).get("address", "").lower() == token.lower()]
    if not ours:
        print(f"{token}: no pair with this token as the base (n/a)")
        return
    best = max(ours, key=lambda p: (p.get("liquidity") or {}).get("usd") or 0)

    price = best.get("priceUsd")                 # a STRING; print as-is
    liq = (best.get("liquidity") or {}).get("usd")
    quote_sym = (best.get("quoteToken") or {}).get("symbol")
    print(token)
    print(f"  price   ${price}" if price else "  price   n/a")
    print(f"  liq     ${liq:,.0f}" if isinstance(liq, (int, float)) else "  liq     n/a")
    print(f"  quote   {quote_sym or '?'}")        # WETH / USDG / a Stock Token (long.xyz)
    print(f"  pair    {best.get('pairAddress')}  ({best.get('dexId')})")
    print("  note    external estimate, not an audited mark")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: python snippets/mark.py <token-address>")
    mark(sys.argv[1])
