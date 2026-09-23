"""Ingest the live rhtrenches tape and gate planted buys. Read-only, keyless.

rhtrenches.com publishes a public trade tape for Robinhood Chain. It is unofficial, so
validate it before you act. Each fill carries a free-form `flags` list. A planted buy (a
wash or airdrop fill staged to look like conviction) is the main copy-trade risk, so the
gate fails closed: a fill is eligible only when its flags are a well-formed list with no
hard-reject keyword. Missing or malformed flags count as unknown and drop the fill, like a
reject.

It then runs one simple copy-trade rule ("Alert B"): sum the eligible BUY value per
(wallet, token) and surface any that clears $10k. This prints signals only. It places no
trade.

    python snippets/signals.py
"""

from __future__ import annotations

import math

import httpx
from eth_utils import is_address, to_checksum_address

TAPE_URL = "https://rhtrenches.com/api/tape"
DETECT_B_MIN_USD = 10_000.0

# Any of these substrings in a flag disqualifies the fill (case-insensitive). A LABEL filter, not
# authentication: it catches only tape-supplied labels using these words. Novel wording, or an
# unlabeled planted buy, is NOT caught.
HARD_REJECT_KEYWORDS = (
    "not a real buy", "planted", "airdrop", "spoofed", "wash",
    "transferred", "gifted", "honeypot", "untradeable", "drained",
)


def verdict(flags) -> str:
    """'clear' (unflagged), 'reject' (a hard-reject keyword in the tape's label), or 'unknown'
    (missing/malformed). Only 'clear' is eligible; the other two both drop the fill (fail closed).
    'clear' means "no matching reject label", NOT "authenticated as a real buy"."""
    if not isinstance(flags, list) or any(not isinstance(f, str) for f in flags):
        return "unknown"
    for f in flags:
        if any(kw in f.lower() for kw in HARD_REJECT_KEYWORDS):
            return "reject"
    return "clear"


def main() -> None:
    r = httpx.get(TAPE_URL, timeout=15)
    if r.status_code != 200:
        raise SystemExit(f"rhtrenches tape unavailable (HTTP {r.status_code}); fail closed, retry")
    rows = r.json()
    if not isinstance(rows, list):
        raise SystemExit("unexpected tape shape (expected a list)")

    counts = {"clear": 0, "reject": 0, "unknown": 0}
    accum: dict[tuple, dict] = {}     # (wallet, token) -> {usd, symbol}
    for r in rows:
        if not isinstance(r, dict) or r.get("side") != "buy":
            continue
        v = verdict(r.get("flags"))
        counts[v] += 1
        if v != "clear":
            continue                  # a planted/unknown buy never contributes
        wallet, token = r.get("wallet"), r.get("token")
        usd = r.get("usd")
        # Require real EVM addresses and a finite, positive, non-bool amount. A tape can send a
        # bad address or a JSON literal like 1e309 (-> inf), which would otherwise inflate a bucket.
        if not (isinstance(wallet, str) and is_address(wallet)
                and isinstance(token, str) and is_address(token)):
            continue
        if isinstance(usd, bool) or not isinstance(usd, (int, float)) or not math.isfinite(usd) or usd <= 0:
            continue
        # Canonicalize so one wallet is one bucket regardless of case OR a missing 0x prefix
        # (is_address accepts both forms).
        key = (to_checksum_address(wallet), to_checksum_address(token))
        slot = accum.setdefault(key, {"usd": 0.0, "symbol": r.get("symbol"), "bad": False})
        total = slot["usd"] + float(usd)
        if not math.isfinite(total):
            slot["bad"] = True          # finite rows can still SUM to inf; invalidate the bucket
            continue
        slot["usd"] = total

    print(f"tape buys: clear={counts['clear']} reject={counts['reject']} unknown={counts['unknown']}")
    fired = [(k, s) for k, s in accum.items() if not s["bad"] and s["usd"] >= DETECT_B_MIN_USD]
    if not fired:
        print(f"no wallet+token cleared ${DETECT_B_MIN_USD:,.0f} in eligible buys this tape")
        return
    print(f"\nAlert B firings (>= ${DETECT_B_MIN_USD:,.0f} eligible buys):")
    for (wallet, token), s in sorted(fired, key=lambda kv: -kv[1]["usd"]):
        print(f"  {s['symbol'] or token}  ${s['usd']:,.0f}  wallet {wallet[:10]}...  token {token}")


if __name__ == "__main__":
    main()
