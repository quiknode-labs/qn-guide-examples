"""Discover brand-new Robinhood Chain pools over WebSockets, then screen them. Read-only.

Relay indexes a new pool fast (usually within seconds), so for a normal buy the path is
`quote.py <token> <base-address>` moments after launch. This snippet is for the first moments and for
screening out dead pools: you can see a pool the instant it is created by subscribing to the Uniswap
v4 PoolManager's `Initialize` event. But a created pool is not a tradeable pool: measured live, about a
third of fresh pools show zero active in-range liquidity when screened, and `Initialize` alone tells
you nothing about depth. So this verifies the socket is on chain 4663, subscribes, labels each new pool
(which side is the token, which is a known base), reads its active in-range liquidity at detect
(LIVE/EMPTY), and re-checks at the end of the window (liquidity is often minted a block or two after
`Initialize`). It signs nothing.

    QUICKNODE_WS=wss://...  python snippets/watch.py [seconds]           # discovery only
    QUICKNODE_WS=wss://...  QUICKNODE_RPC=https://...  python snippets/watch.py [seconds]   # + liquidity screen

The liquidity screen needs QUICKNODE_RPC (one extsload per pool); without it you still get the
labeled discovery list. Needs the `websockets` package (pip install websockets).
"""

from __future__ import annotations

import asyncio
import json
import os
import sys

import websockets
from eth_utils import to_checksum_address

from common import (CHAIN_ID, KNOWN_BASES, NATIVE_ETH, POOL_INIT_TOPIC, POOL_MANAGER, env,
                    pool_liquidity, require_chain_4663)

INIT_TOPIC = POOL_INIT_TOPIC
SCREEN_CAP = 60           # cap the post-window liquidity sweep so a long watch is not a huge RPC burst


def _addr(topic: str) -> str:
    b = bytes.fromhex(topic[2:] if topic.startswith("0x") else topic)
    if len(b) != 32 or any(b[:12]):                      # a valid indexed address: zero upper 12 bytes
        raise ValueError("address topic has nonzero padding")
    return to_checksum_address(b[12:])


def _disp(addr: str) -> str:
    return "ETH(native)" if addr.lower() == NATIVE_ETH.lower() else addr


def _classify(c0: str, c1: str):
    """Which side is the tradeable token vs a known USD base (WETH/USDG/native ETH). 'routable' names
    the has-a-known-base case (the snippet can USD-price it); it is NOT a claim that Relay routes it.
    Returns (token, counterpart, base_label, kind): kind is 'routable' (exactly one side is a known
    base), 'no_base' (neither is: it cannot be USD-priced here, and Relay may or may not route it), or
    'base_base' (both are, unusual)."""
    b0, b1 = KNOWN_BASES.get(c0.lower()), KNOWN_BASES.get(c1.lower())
    if b0 and b1:
        return None, None, None, "base_base"
    if b0:
        return c1, c0, b0, "routable"        # c0 is the base, c1 the token
    if b1:
        return c0, c1, b1, "routable"        # c1 is the base, c0 the token
    return None, None, None, "no_base"


async def watch(seconds: int) -> None:
    url = env("QUICKNODE_WS")
    async with websockets.connect(url) as ws:
        # Verify the chain on THIS socket before trusting anything it sends.
        await ws.send(json.dumps({"jsonrpc": "2.0", "id": 1, "method": "eth_chainId", "params": []}))
        chain = json.loads(await ws.recv()).get("result")
        if not (isinstance(chain, str) and int(chain, 16) == CHAIN_ID):
            raise SystemExit(f"WS endpoint is not chain {CHAIN_ID}; check QUICKNODE_WS")

        await ws.send(json.dumps({
            "jsonrpc": "2.0", "id": 2, "method": "eth_subscribe",
            # filter to Initialize at the source, so the ModifyLiquidity/Swap firehose is never sent.
            "params": ["logs", {"address": POOL_MANAGER, "topics": [INIT_TOPIC]}],
        }))
        if not isinstance(json.loads(await ws.recv()).get("result"), str):
            raise SystemExit("eth_subscribe was not acknowledged")

        print(f"watching PoolManager Initialize for {seconds}s (read-only)...")
        screen = bool(os.environ.get("QUICKNODE_RPC"))    # the liquidity screen needs the HTTP RPC
        if screen:
            try:
                require_chain_4663()      # RPC is configured separately from the WS: verify it once
            except SystemExit:
                print("(QUICKNODE_RPC is not chain 4663 or is unreachable; liquidity screen off)")
                screen = False
        pools: list[dict] = []                 # discovered this session, in order (deduped by poolId)
        seen: set[str] = set()
        try:
            async with asyncio.timeout(seconds):
                async for raw in ws:
                    log = (json.loads(raw).get("params") or {}).get("result")
                    if not isinstance(log, dict) or log.get("removed"):
                        continue                       # skip a reorged-out (removed) event
                    topics = log.get("topics") or []
                    if len(topics) < 4 or topics[0].lower() != INIT_TOPIC.lower():
                        continue                       # only Initialize; ignore the ModifyLiquidity/Swap firehose
                    pid = topics[1].lower()
                    if pid in seen:
                        continue
                    try:
                        c0, c1 = _addr(topics[2]), _addr(topics[3])
                    except (ValueError, TypeError):
                        continue          # malformed Initialize topics -> skip, do not count
                    seen.add(pid)
                    blk = int(log.get("blockNumber", "0x0"), 16)
                    data = bytes.fromhex((log.get("data") or "0x")[2:])   # fee, tickSpacing, hooks, ...
                    fee = int.from_bytes(data[0:32], "big") if len(data) >= 32 else None
                    token, cp, base, kind = _classify(c0, c1)
                    rec = {"pid": topics[1], "block": blk, "c0": c0, "c1": c1, "token": token,
                           "cp": cp, "base": base, "kind": kind, "fee": fee, "detect": None}
                    if screen:
                        # off-load the HTTP extsload read so it does not block the WS loop/timeout. If the
                        # deadline fires DURING the read, still record the pool (as UNK), then re-raise.
                        try:
                            rec["detect"] = await asyncio.to_thread(_detect_liq, topics[1])
                        except asyncio.CancelledError:
                            rec["detect"] = "UNK"
                            _emit(pools, rec)
                            raise
                    _emit(pools, rec)
        except TimeoutError:
            pass

        _summary(pools, seconds, screen)


def _emit(pools: list, rec: dict) -> None:
    """Record a discovered pool and print its labeled discovery line (with the detect-time L tag)."""
    pools.append(rec)
    tag = f"  [{rec['detect']}]" if rec["detect"] else ""
    fee = f"  fee {rec['fee']}" if rec.get("fee") is not None else ""   # distinguishes fee-tier variants
    if rec["kind"] == "routable":
        print(f"  new pool  block {rec['block']}  token {rec['token']}  vs {rec['base']}{fee}{tag}  pool {rec['pid']}")
    elif rec["kind"] == "no_base":
        print(f"  new pool  block {rec['block']}  no known base  {_disp(rec['c0'])} / {_disp(rec['c1'])}  "
              f"(neither side is WETH/USDG/ETH){fee}{tag}  pool {rec['pid']}")
    else:
        print(f"  new pool  block {rec['block']}  base/base  {_disp(rec['c0'])} / {_disp(rec['c1'])}{fee}{tag}  pool {rec['pid']}")


def _detect_liq(pid: str) -> str:
    """Active in-range liquidity state for one pool: LIVE (>0), EMPTY (0), or UNK (read failed).
    Liquidity is often minted a block or two AFTER Initialize, so EMPTY at detect can flip to LIVE
    shortly after; the end-of-window summary re-checks."""
    try:
        return "LIVE" if pool_liquidity(pid, "latest") > 0 else "EMPTY"
    except SystemExit:
        return "UNK"                                    # an RPC failure is UNKNOWN, not "no liquidity"


def _summary(pools: list, seconds: int, screen: bool) -> None:
    n = len(pools)
    print(f"{n} new pool(s) in {seconds}s (provisional; a reorg can still drop one).")
    if not pools:
        print("Never trade a fresh pool on sight. Run the checks first.")
        return
    if not screen:
        print("Set QUICKNODE_RPC to screen in-range liquidity at detect (a created pool often has none yet).")
        print("The normal path is quote.py <token> <base-address>: Relay usually indexes a new pool in seconds.")
        print("Never trade a fresh pool on sight. Run the checks first.")
        return
    # Liquidity is often minted a block or two after Initialize, so re-read at end of window.
    now_states, changed = [], []
    for p in pools[:SCREEN_CAP]:
        now = _detect_liq(p["pid"])
        now_states.append(now)
        if p["detect"] == "EMPTY" and now == "LIVE":     # became active (a new add, OR a tick crossing)
            changed.append(p)
    scr = min(n, SCREEN_CAP)
    live_now, empty_now, unk_now = (now_states.count(s) for s in ("LIVE", "EMPTY", "UNK"))
    detect_live = sum(1 for p in pools[:SCREEN_CAP] if p["detect"] == "LIVE")
    unk_txt = f", {unk_now} unknown (read failed)" if unk_now else ""
    print(f"liquidity now: {live_now} LIVE, {empty_now} EMPTY{unk_txt} of {scr} (was {detect_live} LIVE at detect).")
    for p in changed:
        who = (f"token {p['token']} vs {p['base']}" if p["kind"] == "routable"
               else f"{_disp(p['c0'])} / {_disp(p['c1'])}")
        print(f"  changed EMPTY->LIVE  {who}  pool {p['pid']}")   # a mint, OR a tick crossing activating out-of-range L
    if n > SCREEN_CAP:
        print(f"  ({n - SCREEN_CAP} pools beyond SCREEN_CAP were not re-checked.)")
    print("LIVE means liquidity is live at the tick, NOT that it is deep or exitable. The normal path is")
    print("quote.py <token> <base-address> (Relay indexes in seconds); its error codes say why it refuses")
    print("(dust prices out at size; a region-gated Stock Token does not price).")
    print("Never trade a fresh pool on sight.")


if __name__ == "__main__":
    secs = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    if not 0 < secs <= 86_400:
        raise SystemExit("seconds must be between 1 and 86400")
    asyncio.run(watch(secs))
