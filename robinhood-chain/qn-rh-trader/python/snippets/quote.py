"""Get a real Relay route for a Robinhood Chain buy. Read-only.

Relay's quote API (POST /quote/v2) needs no credential. This DISCOVERS the token's quote
asset (WETH, USDG, or a Stock Token for long.xyz - not assumed) via Dexscreener, then asks
for a quote-asset -> token EXACT_INPUT route on chain 4663 and prints the ordered steps. A
same-chain buy is normally an ERC-20 `approve` then a `swap` (some routes return a Permit2
`signature` step instead). It prints each step's target and, for the approve, the spender,
so you can see and PIN the Relay route contract BEFORE you ever sign. It signs nothing.

    python snippets/quote.py 0x2E8c31162b855A2ffa90F6F8634643Ad6F111e18
    python snippets/quote.py <token> <quote-asset-address>   # force a specific quote asset (an address)

`slippageTolerance` goes as a STRING of basis points, so Relay cannot pick its own. WETH/USDG
decimals are known without a key; a Stock Token quote reads decimals() once (needs QUICKNODE_RPC).
"""

from __future__ import annotations

import sys

import httpx
from eth_abi import decode as abi_decode
from eth_utils import is_address

from common import (CHAIN_ID, checksum, discover_quotes, erc20_decimals, is_chain_4663,
                    probe_amount, valid_calldata, valid_uint)

RELAY_QUOTE_URL = "https://api.relay.link/quote/v2"
PAPER_EOA = "0x000000000000000000000000000000000000c0de"   # a quote needs a user; it signs nothing
APPROVE_SELECTOR = "0x095ea7b3"                            # approve(address,uint256)


def quote(token: str, quote_asset: str | None = None) -> None:
    token = checksum(token)
    if quote_asset is None:
        quotes = discover_quotes(token)
        if not quotes:
            raise SystemExit("no Dexscreener pair found; pass the quote asset explicitly")
        quote_asset = quotes[0]["address"]
        print(f"quote asset (discovered, deepest): {quotes[0]['symbol'] or quote_asset}  {quote_asset}")
    else:
        quote_asset = checksum(quote_asset)
        print(f"quote asset (forced): {quote_asset}")

    amount = probe_amount(erc20_decimals(quote_asset))
    if amount >= 2**256:
        raise SystemExit("quote asset decimals too large to size a probe amount within uint256")
    body = {
        "user": PAPER_EOA, "recipient": PAPER_EOA,
        "originChainId": CHAIN_ID, "destinationChainId": CHAIN_ID,
        "originCurrency": quote_asset, "destinationCurrency": token,
        "amount": str(amount), "tradeType": "EXACT_INPUT",
        "slippageTolerance": "100",   # 100 bps, as a STRING
    }
    resp = httpx.post(RELAY_QUOTE_URL, json=body, timeout=20)
    if resp.status_code >= 400:
        code = ""
        try:
            code = (resp.json() or {}).get("errorCode") or ""
        except ValueError:
            pass
        tail = f", {code}" if code else ""
        # Order matters: infra first (retry), then size (try another size), then the ambiguous
        # currency code, then a genuine no-route (indexing advice justified), then a QUALIFIED generic.
        if resp.status_code == 429 or resp.status_code >= 500:
            raise SystemExit(f"Relay unavailable (HTTP {resp.status_code}{tail}); routing UNKNOWN, retry with backoff.")
        if code in ("SWAP_IMPACT_TOO_HIGH", "AMOUNT_TOO_HIGH", "AMOUNT_TOO_LOW", "INSUFFICIENT_LIQUIDITY"):
            # A SIZE/amount/liquidity problem, not indexing: the pool is likely indexed but cannot fill
            # THIS amount. A different size is the fix, not watch.py. AMOUNT_TOO_LOW needs a LARGER size;
            # impact/too-high/insufficient-liquidity a SMALLER one.
            hint = "try a larger size" if code == "AMOUNT_TOO_LOW" else "try a smaller size"
            raise SystemExit(f"Relay cannot quote this size (HTTP {resp.status_code}{tail}): the pool is "
                             f"likely indexed but cannot fill this amount ({hint}).")
        if code == "UNSUPPORTED_CURRENCY":
            # Ambiguous per Relay: unsupported for input/output OR the pair cannot be priced (possibly
            # transient). Do not assert a missing/unindexed pool. Mirror sellability's handling.
            raise SystemExit(f"Relay returned UNSUPPORTED_CURRENCY (HTTP {resp.status_code}): the pair is "
                             f"unsupported OR cannot be priced right now (Relay bundles both); routing UNKNOWN.")
        if code in ("NO_QUOTES", "NO_SWAP_ROUTES_FOUND", "NO_INTERNAL_SWAP_ROUTES_FOUND"):
            # A genuine no-route for these parameters. Indexing is only ONE possibility (the common one
            # for a fresh token), so offer watch.py conditionally, not as the certain cause.
            raise SystemExit(f"Relay found no route for these parameters (HTTP {resp.status_code}{tail}): if "
                             f"this token is brand new, its pool may not be indexed yet (try watch.py, then "
                             f"retry); otherwise the pair may be unroutable.")
        # Validation / permission / restriction / unlabeled: do NOT assert no route. Mention indexing
        # only as a possibility for a brand-new token.
        raise SystemExit(f"Relay quote failed (HTTP {resp.status_code}{tail}); routing UNKNOWN "
                         f"(if this token is brand new, its pool may not be indexed yet: try watch.py, then retry).")
    payload = resp.json()
    steps = payload.get("steps") if isinstance(payload, dict) else None
    if not isinstance(steps, list) or not steps:
        raise SystemExit("Relay 200 response had no steps; unexpected response, routing UNKNOWN")

    saw_swap = False
    for step in steps:
        label = step.get("id") or step.get("action") or step.get("kind")
        if step.get("kind") == "signature":
            # A signature step needs an off-chain signature, and the `kind` alone does NOT say what
            # it authorizes: a permit (Permit2/EIP-2612/EIP-3009), a signed order, or a wallet-ownership
            # auth. A signature can move funds without a broadcast, so treat it as a potential
            # fund-movement authorization and inspect the typed data before signing.
            print(f"{label:10} SIGNATURE step (kind alone is not the authorization: could be a permit, a "
                  f"signed order, or an ownership auth -- inspect the typed data; it may move funds)")
            continue
        sid = str(label).lower()
        items = step.get("items") or []
        if not items:
            raise SystemExit(f"Relay step '{label}' has no transaction items; unusable route, routing UNKNOWN")
        for item in items:
            d = item.get("data") or {}
            to, data = d.get("to"), d.get("data")
            # Validate BEFORE printing success: require a real target ADDRESS and PURE-hex calldata
            # carrying at least a 4-byte selector (valid_calldata rejects whitespace-padded calldata,
            # which bytes.fromhex would silently skip), on chain 4663, with a numeric value. A malformed,
            # cross-chain, or bad-value step is an unusable route, not a quote to pin -> UNKNOWN nonzero.
            if not (isinstance(to, str) and is_address(to) and valid_calldata(data)):
                raise SystemExit(f"Relay step '{label}' has an invalid target or calldata; routing UNKNOWN")
            raw = bytes.fromhex(data[2:])   # valid_calldata guarantees pure even-length hex
            cid, val = d.get("chainId"), d.get("value")
            # Validate, don't just convert: int() would truncate 4663.9 -> 4663 and accept value=-1/0.5.
            # value must be an unsigned bounded integer; chainId, if present, exactly 4663.
            if val is not None and not valid_uint(val):
                raise SystemExit(f"Relay step '{label}' has an invalid tx value {val!r}; routing UNKNOWN")
            if cid is not None and not is_chain_4663(cid):
                raise SystemExit(f"Relay step '{label}' targets chain {cid!r}, not {CHAIN_ID}; routing UNKNOWN")
            if data.lower().startswith(APPROVE_SELECTOR):
                if len(raw) < 4 + 64:      # selector + (address, uint256) words
                    raise SystemExit(f"Relay approve step '{label}' has truncated calldata; routing UNKNOWN")
                spender, _amount = abi_decode(["address", "uint256"], raw[4:])
                print(f"{label:10} approve spender  {checksum(spender)}")
            else:
                print(f"{label:10} target           {checksum(to)}")
                if "swap" in sid:          # count only a Relay swap-identified step as the swap
                    saw_swap = True
    if not saw_swap:
        raise SystemExit("Relay route had no swap step with usable calldata; routing UNKNOWN")
    print("PIN the swap target and the approval spender (verify against Relay's docs) before live use.")


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3):
        raise SystemExit("usage: python snippets/quote.py <token-address> [quote-asset-address]")
    quote(*sys.argv[1:])
