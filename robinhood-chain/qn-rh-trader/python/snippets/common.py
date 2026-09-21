"""Shared helpers for the Robinhood Chain guide snippets. Read-only, paper-first.

Every snippet reads its endpoint from the ENVIRONMENT, never a config file or the OS
keychain: export QUICKNODE_RPC (and QUICKNODE_WS for watch.py) to your Robinhood Chain
4663 endpoint, and never commit it. Nothing here signs or broadcasts.

These are TEACHING snippets. They favor a clear, correct core over the defensive hardening
a real bot needs (byte caps, response sanitizing, retries, per-token storage layouts). The
guide's "From snippets to a bot" section lists what to add before you trust any of this with
money.

Run any snippet from the repo root, e.g.:  python snippets/mark.py 0x<token>
"""

from __future__ import annotations

import os

import httpx
from eth_utils import is_address, keccak, to_checksum_address

CHAIN_ID = 4663

# Uniswap v4 core, verified on 4663 (eth_getCode non-empty; re-verify against Robinhood's docs).
POOL_MANAGER = "0x8366a39cc670b4001a1121b8f6a443a643e40951"   # v4 PoolManager on 4663 (excludes V3 + pre-graduation bonding-curve markets)
V4_QUOTER = "0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94"      # read-only quoter (no funds)
# topic0 of the v4 Initialize event, recomputed from the canonical signature (matches live logs).
POOL_INIT_TOPIC = "0x" + keccak(
    text="Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)").hex()
DYNAMIC_FEE = 0x800000   # a fee sentinel: a dynamic LP fee the hook updates and/or overrides per
#                          swap (NOT an 838% fee); read the realized rate from a Swap event

# Verified 4663 quote assets. Re-verify against Robinhood's contract docs before live use.
WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73"   # 18 decimals
USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"   # 6 decimals

# Dexscreener indexes Robinhood Chain under this SLUG (the numeric 4663 returns []).
DEXSCREENER = "https://api.dexscreener.com"
CHAIN_SLUG = "robinhood"

NATIVE_ETH = "0x0000000000000000000000000000000000000000"   # v4 pools can quote in native ETH

# The quote/settlement asset differs by MARKET TYPE, and a single token trades across MANY LPs
# with different quotes: a long.xyz token like $AI has WETH, USDG, native-ETH, and a Stock-Token
# (e.g. NVDA) pool at once. Never assume WETH: discover the set (below). WETH/USDG/native-ETH are
# 18/6/18 decimals; any other quote (a Stock Token) is read once via decimals().
KNOWN_DECIMALS = {WETH.lower(): 18, USDG.lower(): 6, NATIVE_ETH.lower(): 18}

# The USD-priceable bases, mapped to a short display label. A pool whose counterpart is one of these
# has an interpretable (USD-ish) price; any other counterpart is another token (often a Stock Token).
KNOWN_BASES = {WETH.lower(): "WETH", USDG.lower(): "USDG", NATIVE_ETH.lower(): "ETH"}


def env(name: str) -> str:
    """Read a required endpoint from the environment. Fail with a clear message, never a
    traceback, and never echo the value (it carries your Quicknode token)."""
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"set {name} to your Robinhood Chain 4663 endpoint (do not commit it)")
    return value


def checksum(addr: str) -> str:
    if not isinstance(addr, str) or not is_address(addr):
        raise SystemExit(f"not a valid address: {addr!r}")
    return to_checksum_address(addr)


def valid_uint(v, bits: int = 256) -> bool:
    """True only if v is a NON-NEGATIVE, whole integer below 2**bits, given as an int or a decimal/0x
    string. Rejects bool, float (e.g. 0.5), negatives, and non-numeric strings. Use to validate a tx
    `value` from an untrusted route: `int(v)` alone would accept -1, and int(0.5) silently becomes 0."""
    if isinstance(v, bool):
        return False
    if isinstance(v, int):
        return 0 <= v < (1 << bits)
    if isinstance(v, str):
        try:
            n = int(v, 16) if v.lower().startswith("0x") else int(v)
        except ValueError:
            return False
        return 0 <= n < (1 << bits)
    return False


def is_chain_4663(c) -> bool:
    """True only if c is EXACTLY chain 4663, as an int or an integer string. Rejects bool and float
    (e.g. 4663.9, which int() would truncate to 4663) and any non-4663 value."""
    if isinstance(c, bool):
        return False
    if isinstance(c, int):
        return c == CHAIN_ID
    if isinstance(c, str):
        try:
            return (int(c, 16) if c.lower().startswith("0x") else int(c)) == CHAIN_ID
        except ValueError:
            return False
    return False


def valid_calldata(data, min_bytes: int = 4) -> bool:
    """True only if data is a '0x'-prefixed string of an EVEN number of PURE hex digits decoding to at
    least min_bytes bytes. A bare length check is not enough: bytes.fromhex() silently skips ASCII
    whitespace, so '0x        ' (10 chars) decodes to ZERO bytes and '0x12      ' to one -- neither
    carries the 4-byte selector, yet both would pass a `len(data) >= 10` gate. Requiring pure hex
    rejects that. Use to validate untrusted route calldata before trusting it as a usable tx item."""
    if not (isinstance(data, str) and data.startswith("0x")):
        return False
    body = data[2:]
    if len(body) % 2 != 0 or len(body) < min_bytes * 2:
        return False
    return all(c in "0123456789abcdefABCDEF" for c in body)


def rpc(method: str, params: list, *, url: str | None = None, timeout: float = 20.0):
    """One JSON-RPC call to QUICKNODE_RPC. On a transport/RPC failure, exit with the error
    CLASS only: the endpoint URL carries your token, so it is never printed."""
    url = url or env("QUICKNODE_RPC")
    try:
        resp = httpx.post(
            url, json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
            timeout=timeout,
        )
        resp.raise_for_status()
        body = resp.json()
    except httpx.HTTPStatusError as exc:
        raise SystemExit(f"RPC {method} failed: HTTP {exc.response.status_code}")
    except httpx.HTTPError as exc:
        raise SystemExit(f"RPC {method} transport error: {type(exc).__name__}")
    if isinstance(body, dict) and body.get("error") is not None:
        raise SystemExit(f"RPC {method} returned an error: {body['error']}")
    return body["result"]


def rpc_allow_revert(method: str, params: list, *, timeout: float = 20.0):
    """Like rpc(), but returns (None, message) for a JSON-RPC EXECUTION error (e.g. a reverted
    eth_call) instead of raising, while a transport/HTTP failure still RAISES. This lets a caller
    tell a genuine on-chain revert (a real outcome) apart from an endpoint failure (UNKNOWN).
    Returns (result, None) on success."""
    url = env("QUICKNODE_RPC")
    try:
        resp = httpx.post(
            url, json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params}, timeout=timeout)
        resp.raise_for_status()
        body = resp.json()
    except httpx.HTTPStatusError as exc:
        raise SystemExit(f"RPC {method} failed: HTTP {exc.response.status_code}")
    except httpx.HTTPError as exc:
        raise SystemExit(f"RPC {method} transport error: {type(exc).__name__}")
    if isinstance(body, dict) and body.get("error") is not None:
        err = body["error"]
        code = err.get("code") if isinstance(err, dict) else None
        msg = str(err.get("message") if isinstance(err, dict) else err)
        if code == 3 or "execution reverted" in msg.lower() or "revert" in msg.lower():
            return None, msg                 # a genuine on-chain EXECUTION revert (a real outcome)
        raise SystemExit(f"RPC {method} error: {msg}")   # method-not-found / bad-params / etc = UNKNOWN
    return body.get("result"), None


def dex_pairs(token: str) -> list:
    """Every Dexscreener pair for a token on Robinhood Chain. Returns [] ONLY for a genuine empty
    result (HTTP 200, no pools); a transport error, a non-200, or a non-JSON body RAISES, so a
    failure is never mistaken for "no pools".

    Uses /token-pairs/v1, which returns ALL of a token's pools (up to 30). Do NOT use /tokens/v1
    here: it returns only the single primary pair, so it hides the other bases a token trades
    against. Liquidity figures are Dexscreener's and can differ from an aggregator's own UI."""
    token = checksum(token)
    try:
        r = httpx.get(f"{DEXSCREENER}/token-pairs/v1/{CHAIN_SLUG}/{token}", timeout=15)
    except httpx.HTTPError as exc:
        raise SystemExit(f"Dexscreener request failed ({type(exc).__name__}); discovery UNKNOWN, retry")
    if r.status_code != 200:
        raise SystemExit(f"Dexscreener returned HTTP {r.status_code}; discovery UNKNOWN, retry")
    try:
        pairs = r.json()
    except ValueError:
        raise SystemExit("Dexscreener returned a non-JSON body; discovery UNKNOWN")
    if not isinstance(pairs, list):
        # A 200 that is not a list (e.g. an error object) is UNKNOWN, not "no pools".
        raise SystemExit("Dexscreener returned an unexpected (non-list) body; discovery UNKNOWN")
    for p in pairs:
        # A malformed entry (e.g. [null], [{}], or a pair missing a token address) is UNKNOWN, not a
        # genuine empty result. Do not silently skip it: that could turn a broken response into a
        # false "no pools". A real pair always carries baseToken.address and quoteToken.address.
        if not isinstance(p, dict):
            raise SystemExit("Dexscreener returned malformed pair entries; discovery UNKNOWN")
        b = (p.get("baseToken") or {}).get("address")
        q = (p.get("quoteToken") or {}).get("address")
        if not (isinstance(b, str) and b and isinstance(q, str) and q):
            raise SystemExit("Dexscreener pair is missing a token address; discovery UNKNOWN")
    return pairs


def discover_quotes(token: str) -> list:
    """The counterpart assets a token trades against, DEEPEST first, from Dexscreener:
    [{address, symbol, liq_usd, pair}]. Matches the token on EITHER side of a pool and returns
    the OPPOSITE token, so it does not miss a pool where the token is the quote side. Use this
    instead of assuming WETH: a token quotes in WETH, USDG, native ETH, or a Stock Token."""
    token_l = checksum(token).lower()
    quotes: dict[str, dict] = {}
    for p in dex_pairs(token):
        base, quote = p.get("baseToken") or {}, p.get("quoteToken") or {}
        base_a, quote_a = (base.get("address") or "").lower(), (quote.get("address") or "").lower()
        if token_l == base_a:
            cp = quote                                 # token is the base -> counterpart is the quote
        elif token_l == quote_a:
            cp = base                                  # token is the quote -> counterpart is the base
        else:
            continue                                   # token on neither side (unrelated pair)
        addr = cp.get("address")
        if not isinstance(addr, str) or not addr:
            continue
        liq = (p.get("liquidity") or {}).get("usd") or 0
        prev = quotes.get(addr.lower())
        if prev is None or liq > prev["liq_usd"]:
            quotes[addr.lower()] = {"address": checksum(addr), "symbol": cp.get("symbol"),
                                    "liq_usd": liq, "pair": p.get("pairAddress")}
    return sorted(quotes.values(), key=lambda x: -x["liq_usd"])


def require_chain_4663() -> None:
    """Raise unless QUICKNODE_RPC serves chain 4663. A Relay request's chainId does NOT constrain
    this separate RPC endpoint, so a simulation or metadata read on the wrong chain would be
    meaningless. Any path that simulates or reads unknown-token metadata calls this first."""
    try:
        chain = int(rpc("eth_chainId", []), 16)
    except (ValueError, TypeError):
        raise SystemExit("could not read chainId from QUICKNODE_RPC")
    if chain != CHAIN_ID:
        raise SystemExit(f"QUICKNODE_RPC serves chain {chain}, not {CHAIN_ID}; point it at Robinhood Chain")


def erc20_decimals(addr: str) -> int:
    """decimals() for a quote asset. WETH/USDG are known (no RPC needed); anything else, e.g.
    a long.xyz Stock Token quote, is read via one eth_call on 4663 (verified first), so QUICKNODE_RPC
    is used only then."""
    a = checksum(addr)
    if a.lower() in KNOWN_DECIMALS:
        return KNOWN_DECIMALS[a.lower()]
    require_chain_4663()                                          # do not size from a wrong-chain read
    res = rpc("eth_call", [{"to": a, "data": "0x313ce567"}, "latest"])          # decimals()
    if not (isinstance(res, str) and len(res) >= 66):            # a uint8 is a full 32-byte word
        raise SystemExit("decimals() returned a malformed (non-32-byte) result; UNKNOWN")
    d = int(res, 16)
    if not 0 <= d <= 255:                                         # ERC-20 decimals() is a uint8
        raise SystemExit(f"token reported implausible decimals ({d}); refusing to size a probe")
    return d


def probe_amount(decimals: int) -> int:
    """A small, decimals-aware probe size in an asset's RAW units: 25 units for a 6-dp asset
    (USDG-like), 0.01 of the asset for anything >= 2 dp (at ANY scale, incl. > 18 dp), and 1 whole
    unit below 2 dp. One source of truth in common, imported by quote.py, so a generic counterpart
    (e.g. a Stock Token, from its on-chain decimals()) is sized consistently and cannot drift."""
    if decimals == 6:
        return 25 * 10**6            # 25 of a 6-dp asset (USDG-like)
    if decimals >= 2:
        return 10**(decimals - 2)    # 0.01 of the asset, at ANY scale (incl. > 18 dp)
    return 10**decimals              # sub-2-dp fallback: 1 whole unit


def pool_id(c0: str, c1: str, fee: int, tick_spacing: int, hooks: str) -> str:
    """The deterministic v4 poolId = keccak(abi.encode(currency0, currency1, fee, tickSpacing,
    hooks)). Lets you verify a log's poolId offline instead of trusting it."""
    from eth_abi import encode as abi_encode
    return "0x" + keccak(abi_encode(
        ["address", "address", "uint24", "int24", "address"],
        [checksum(c0), checksum(c1), fee, tick_spacing, checksum(hooks)])).hex()


def pool_liquidity(pid: str, block: str = "latest") -> int:
    """Current IN-RANGE (active) liquidity for a poolId via one extsload (no swap scan): the low
    uint128 at keccak(poolId . uint256(6)) + 3 in the PoolManager, read at `block`. Needs
    QUICKNODE_RPC. An infrastructure failure RAISES (that is UNKNOWN, never silently "0 liquidity").
    A 0 result means not-liquid at the tick. NOTE this is active liquidity only: 0 can coexist with
    funded out-of-range positions, and a positive value does not prove an executable sale. It is a
    screen (is anything live at the current tick), not a tradeability proof."""
    pidb = bytes.fromhex(pid[2:] if pid.startswith("0x") else pid)
    state_slot = keccak(pidb + (6).to_bytes(32, "big"))                 # POOLS_SLOT = 6
    liq_slot = (int.from_bytes(state_slot, "big") + 3).to_bytes(32, "big")   # LIQUIDITY_OFFSET = 3
    res = rpc("eth_call", [{"to": POOL_MANAGER, "data": "0x1e2eaeaf" + liq_slot.hex()}, block])
    if not (isinstance(res, str) and len(res) >= 66):
        raise SystemExit("extsload returned an undersized word; liquidity UNKNOWN")   # not "0 liquidity"
    return int(res, 16) & ((1 << 128) - 1)   # a full 32-byte word: 0 here genuinely means not-liquid


def verify_quote_onchain(quote_addr: str) -> dict | None:
    """Optional on-chain sanity check of a discovered base, used ONLY when QUICKNODE_RPC is set
    (returns None otherwise, so keyless discovery still works). Dexscreener's per-pool liquidity
    can be off, so this confirms the endpoint is chain 4663 AND the base is a REAL contract with
    a valid uint8 decimals(), not a phantom listing. Relay handles the actual swap routing, so the
    base is mainly informational. Returns chain_ok=False if the endpoint is the wrong chain."""
    if not os.environ.get("QUICKNODE_RPC"):
        return None
    a = checksum(quote_addr)
    try:
        chain = int(rpc("eth_chainId", []), 16)
    except (SystemExit, ValueError, TypeError):
        chain = None
    if chain != CHAIN_ID:
        return {"chain_ok": False, "chain": chain}
    if a.lower() == NATIVE_ETH.lower():
        return {"chain_ok": True, "native": True, "code": True, "decimals": 18}
    code = rpc("eth_getCode", [a, "latest"])
    has_code = isinstance(code, str) and code not in ("0x", "0x0", "")
    decimals = None
    if has_code:
        try:
            r = rpc("eth_call", [{"to": a, "data": "0x313ce567"}, "latest"])
            d = int(r, 16) if isinstance(r, str) and len(r) >= 66 else -1   # need a full 32-byte word
            decimals = d if 0 <= d <= 255 else None    # else unverified (not a valid uint8 word)
        except (SystemExit, ValueError, TypeError):
            decimals = None
    return {"chain_ok": True, "native": False, "code": has_code, "decimals": decimals}
