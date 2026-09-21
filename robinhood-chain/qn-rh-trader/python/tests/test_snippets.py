"""Offline tests for the guide snippets' pure logic (no network).

These lock the parts the guide leans on: the planted-buy label gate, decimals-aware probe
sizing, the eth_simulateV1 value/delta helpers, and multi-base discovery ranking. Network
paths (Relay, Dexscreener, RPC, WSS) are exercised by hand against a live endpoint, not here.
"""

from __future__ import annotations

import pytest

import common
import quote as q
import sellability as sell
import signals as sig
from eth_utils import keccak


def test_label_gate_verdict():
    assert sig.verdict([]) == "clear"                              # confirmed, no reject keyword
    assert sig.verdict(["early dip buy"]) == "clear"
    assert sig.verdict(["not a real buy (planted)"]) == "reject"   # the live planted string
    assert sig.verdict(["planted"]) == "reject"
    assert sig.verdict(["potential honeypot"]) == "reject"
    assert sig.verdict("not-a-list") == "unknown"                  # malformed -> fail closed
    assert sig.verdict([1]) == "unknown"                           # non-string element
    assert sig.verdict(None) == "unknown"


def test_probe_amount_is_decimals_aware():
    assert q.probe_amount(18) == 10**16          # 0.01 of an 18-dp asset (WETH-like)
    assert q.probe_amount(6) == 25 * 10**6       # 25 of a 6-dp asset (USDG-like)
    assert q.probe_amount(8) == 10**6            # 0.01 of an 8-dp asset
    assert q.probe_amount(24) == 10**22          # 0.01 scales past 18 dp (no dust)
    assert q.probe_amount(0) == 1                # sub-2-dp fallback: 1 whole unit


def test_hexval_normalizes_sim_values():
    assert sell._hexval("0") == "0x0"
    assert sell._hexval("0x5") == "0x5"
    assert sell._hexval(10) == "0xa"
    assert sell._hexval(None) == "0x0"
    assert sell._hexval("0X1") == "0X1"      # uppercase 0X prefix must not fall to decimal int() and crash
    assert int(sell._hexval("0Xff"), 16) == 255


def test_valid_calldata_requires_pure_hex_selector():
    import common
    assert common.valid_calldata("0x095ea7b3")                       # a bare 4-byte selector
    assert common.valid_calldata("0x095ea7b3" + "00" * 64)           # selector + two words
    assert not common.valid_calldata("0x")                           # empty: no selector
    assert not common.valid_calldata("0x1234")                       # 2 bytes < 4-byte selector
    assert not common.valid_calldata("0x        ")                   # whitespace -> 0 decoded bytes
    assert not common.valid_calldata("0x12      ")                   # whitespace -> 1 decoded byte
    assert not common.valid_calldata("0x095ea7b")                    # odd digit count
    assert not common.valid_calldata("0xzzzzzzzz")                   # non-hex
    assert not common.valid_calldata("095ea7b3")                     # missing 0x
    assert not common.valid_calldata(None) and not common.valid_calldata(b"0x095ea7b3")


def test_token_delta_from_transfer_logs():
    wallet = "0x000000000000000000000000000000000000C0DE"
    token = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73"
    zero = "0x0000000000000000000000000000000000000000"
    tt = "0x" + keccak(text="Transfer(address,address,uint256)").hex()
    topic = lambda a: "0x" + "0" * 24 + a[2:].lower()
    word = lambda n: "0x" + n.to_bytes(32, "big").hex()          # a 32-byte data word
    results = [
        {"logs": [{"address": token, "topics": [tt, topic(zero), topic(wallet)], "data": word(1000)}]},   # +1000 in
        {"logs": [{"address": token, "topics": [tt, topic(wallet), topic(zero)], "data": word(300)}]},     # -300 out
    ]
    assert sell.token_delta(results, token, wallet) == 700
    # a malformed Transfer from the token (short data) fails closed as UNKNOWN
    bad = [{"logs": [{"address": token, "topics": [tt, topic(zero), topic(wallet)], "data": "0x1234"}]}]
    with pytest.raises(SystemExit):
        sell.token_delta(bad, token, wallet)


def test_discover_quotes_dedupes_by_quote_and_ranks_by_liquidity(monkeypatch):
    token = "0x2E8c31162b855A2ffa90F6F8634643Ad6F111e18"
    weth, usdg = common.WETH, common.USDG
    pairs = [
        {"baseToken": {"address": token}, "quoteToken": {"address": weth, "symbol": "WETH"},
         "liquidity": {"usd": 100}, "pairAddress": "0xa"},
        {"baseToken": {"address": token}, "quoteToken": {"address": weth, "symbol": "WETH"},
         "liquidity": {"usd": 5000}, "pairAddress": "0xb"},                       # deeper WETH pool
        {"baseToken": {"address": token}, "quoteToken": {"address": usdg, "symbol": "USDG"},
         "liquidity": {"usd": 2000}, "pairAddress": "0xc"},
        {"baseToken": {"address": "0x1111111111111111111111111111111111111111"},   # base != token -> ignored
         "quoteToken": {"address": weth, "symbol": "WETH"}, "liquidity": {"usd": 9999}, "pairAddress": "0xd"},
    ]
    monkeypatch.setattr(common, "dex_pairs", lambda t: pairs)
    quotes = common.discover_quotes(token)
    assert [x["symbol"] for x in quotes] == ["WETH", "USDG"]      # deepest-first, one row per quote
    assert quotes[0]["liq_usd"] == 5000 and quotes[0]["pair"] == "0xb"   # kept the deeper WETH pool


def test_signals_rejects_bad_values_and_normalizes_case(monkeypatch, capsys):
    import signals as sig
    w, t = "0x" + "1" * 40, "0x" + "2" * 40
    rows = [
        {"side": "buy", "flags": [], "wallet": w, "token": t, "usd": 1e309, "symbol": "INF"},   # inf -> dropped
        {"side": "buy", "flags": [], "wallet": "notanaddr", "token": t, "usd": 5000, "symbol": "BAD"},  # bad addr
        {"side": "buy", "flags": [], "wallet": w, "token": t, "usd": 6000, "symbol": "OK"},      # counts
        {"side": "buy", "flags": [], "wallet": w.upper(), "token": t, "usd": 7000, "symbol": "OK"},  # same bucket (case)
    ]
    monkeypatch.setattr(sig.httpx, "get",
                        lambda *a, **k: type("R", (), {"status_code": 200, "json": lambda self: rows})())
    sig.main()
    out = capsys.readouterr().out
    assert "inf" not in out.lower()                 # nonfinite amount never surfaces
    assert "$13,000" in out                         # 6000 + 7000 in ONE case-normalized bucket -> fires


def test_sellability_rejects_native_value_route(monkeypatch):
    import sellability as sell
    def post_route(value):
        route = {"steps": [{"items": [{"data": {"to": "0x" + "3" * 40, "value": value, "data": "0x"}}]}]}
        monkeypatch.setattr(sell.httpx, "post",
                            lambda *a, **k: type("R", (), {"status_code": 200, "json": lambda self: route})())
    post_route("1000")
    with pytest.raises(SystemExit):                 # a native-value route is rejected (WETH-only probe)
        sell.relay_quote(sell.WETH, "0x" + "2" * 40, 100)
    # a MALFORMED value must not be silently coerced to 0 by _hexval (0.5/-0.5/False -> "0x0"): reject it
    for bad in (0.5, -0.5, False, "-1"):
        post_route(bad)
        with pytest.raises(SystemExit):
            sell.relay_quote(sell.WETH, "0x" + "2" * 40, 100)
    # "0X1" (uppercase prefix) is a valid uint per valid_uint; _hexval must parse it (not crash with a
    # ValueError) so a nonzero value reaches the documented native-value PARK (exit 7), not exit 1.
    post_route("0X1")
    with pytest.raises(SystemExit) as ei:
        sell.relay_quote(sell.WETH, "0x" + "2" * 40, 100)
    assert ei.value.code == 7


def test_relay_quote_parks_on_size_or_impact_codes(monkeypatch, capsys):
    import sellability as sell
    def resp(status, code):
        return type("R", (), {"status_code": status, "json": lambda self: {"errorCode": code}})()
    # every request/size code PARKS at exit 7 (never a retryable exit-1 error, never a pass).
    # SWAP_IMPACT_TOO_HIGH is the live honeypot signal (the 5 known honeypots all returned it).
    for code in ("SWAP_IMPACT_TOO_HIGH", "AMOUNT_TOO_HIGH", "AMOUNT_TOO_LOW", "NO_QUOTES",
                 "NO_SWAP_ROUTES_FOUND", "NO_INTERNAL_SWAP_ROUTES_FOUND", "INSUFFICIENT_LIQUIDITY"):
        monkeypatch.setattr(sell.httpx, "post", lambda *a, **k: resp(400, code))
        with pytest.raises(SystemExit) as ei:
            sell.relay_quote(sell.WETH, "0x" + "2" * 40, 100)
        assert ei.value.code == 7, code            # park, not retryable
    # the advice must not over-claim: below-minimum => try LARGER; over-ceiling/thin-liquidity => SMALLER.
    def hint(code):
        capsys.readouterr()
        monkeypatch.setattr(sell.httpx, "post", lambda *a, **k: resp(400, code))
        with pytest.raises(SystemExit):
            sell.relay_quote(sell.WETH, "0x" + "2" * 40, 100)
        return capsys.readouterr().out
    assert "LARGER" in hint("AMOUNT_TOO_LOW")
    assert "SMALLER" in hint("SWAP_IMPACT_TOO_HIGH")
    assert "SMALLER" in hint("INSUFFICIENT_LIQUIDITY")
    # a transient 429 stays a retryable raise (exit 1), NOT the size-park exit 7
    monkeypatch.setattr(sell.httpx, "post", lambda *a, **k: resp(429, ""))
    with pytest.raises(SystemExit) as ei:
        sell.relay_quote(sell.WETH, "0x" + "2" * 40, 100)
    assert ei.value.code != 7
    # a currency-pair code returns the ([], code) skip path, not a raise
    monkeypatch.setattr(sell.httpx, "post", lambda *a, **k: resp(400, "UNSUPPORTED_CURRENCY"))
    calls, code = sell.relay_quote(sell.WETH, "0x" + "2" * 40, 100)
    assert calls == [] and code == "UNSUPPORTED_CURRENCY"


def test_sellability_flags_reverse_sell_revert_as_suspect(monkeypatch, capsys):
    # A CLEAN-BUY honeypot: the buy settles and credits base, but the reverse-sell reverts. The live
    # known honeypots never reached this path (Relay rejected their buy at SWAP_IMPACT_TOO_HIGH), so
    # this synthesizes it to lock the reverse-sell detection: it MUST report SUSPECT and exit 7,
    # never a clean pass (exit 0).
    import sellability as sell
    tok = "0x" + "2" * 40
    word = lambda n: "0x" + n.to_bytes(32, "big").hex()
    topic = lambda a: "0x" + "0" * 24 + a[2:].lower()
    zero = "0x" + "0" * 40
    tt = sell.TRANSFER_TOPIC
    buy_leg = {"status": "0x1", "logs": [
        {"address": tok, "topics": [tt, topic(zero), topic(sell.WALLET)], "data": word(10**21)}]}
    sell_leg = {"status": "0x0", "logs": []}        # the reverse-sell reverted (the honeypot signal)

    monkeypatch.setattr(sell, "require_chain_4663", lambda: None)
    monkeypatch.setattr(sell, "relay_quote", lambda origin, dest, amt: ([{"to": tok, "data": "0x"}], 10**21))
    def fake_rpc(method, params, **k):
        if method == "eth_blockNumber":
            return "0x10"
        if method == "eth_getBlockByNumber":
            return {"timestamp": "0x5", "baseFeePerGas": "0x1"}
        raise AssertionError(method)
    monkeypatch.setattr(sell, "rpc", fake_rpc)
    monkeypatch.setattr(sell, "_simulate",
                        lambda calls, block, time_hex, base_fee: [buy_leg] if len(calls) == 1 else [buy_leg, sell_leg])

    with pytest.raises(SystemExit) as ei:
        sell.main(tok)
    assert ei.value.code == 7                        # SUSPECT, never a clean exit-0 pass
    out = capsys.readouterr().out.lower()
    assert "reverse-sell failed" in out and "honeypot" in out


def test_relay_pair_status_classifies_precisely(monkeypatch):
    import sellability as sell
    swap = sell.APPROVE_SELECTOR.replace("095ea7b3", "12345678") + "0" * 8   # non-approve calldata
    approve = sell.APPROVE_SELECTOR + "0" * 8
    def resp(status, body):
        return type("R", (), {"status_code": status, "json": lambda self: body})()
    def status(r):
        monkeypatch.setattr(sell.httpx, "post", lambda *a, **k: r)
        return sell.relay_pair_status(sell.WETH, "0x" + "2" * 40, 100)
    route = "0x" + "cc" * 20
    def swapstep(**data): return {"id": "swap", "items": [{"data": {"to": route, "data": swap, **data}}]}
    # a real 200 with a usable SWAP-identified item on chain 4663 -> routes
    assert status(resp(200, {"steps": [swapstep()]})) == "routes"
    assert status(resp(200, {"steps": [swapstep(chainId=4663, value="0x0")]})) == "routes"
    # approve-only, empty-steps, missing-data, non-dict body, and a 202 are all NOT proven routes
    assert status(resp(200, {"steps": [{"id": "approve", "items": [{"data": {"to": route, "data": approve}}]}]})) == "unknown"
    # a full-length approve with NONZERO address padding is invalid ABI (quote.py's abi_decode rejects
    # it too): alongside a real swap it must NOT establish a route
    bad_approve = sell.APPROVE_SELECTOR + "11" + "0" * 22 + "a" * 40 + "0" * 64   # padding byte 0x11 != 0
    good_approve = sell.APPROVE_SELECTOR + "0" * 24 + "b" * 40 + "0" * 64         # clean address word
    approve_bad = {"id": "approve", "items": [{"data": {"to": route, "data": bad_approve}}]}
    approve_ok = {"id": "approve", "items": [{"data": {"to": route, "data": good_approve}}]}
    assert status(resp(200, {"steps": [approve_bad, swapstep()]})) == "unknown"
    assert status(resp(200, {"steps": [approve_ok, swapstep()]})) == "routes"    # regression: clean approve+swap still routes
    assert status(resp(200, {"steps": []})) == "unknown"
    assert status(resp(200, {"steps": [{"items": [{"data": {}}]}]})) == "unknown"
    assert status(resp(200, ["not", "a", "dict"])) == "unknown"
    assert status(resp(202, {})) == "unknown"
    # a non-empty but INVALID target or non-hex calldata must NOT count as a route
    assert status(resp(200, {"steps": [swapstep()] and [{"id": "swap", "items": [{"data": {"to": "not-an-address", "data": swap}}]}]})) == "unknown"
    assert status(resp(200, {"steps": [{"id": "swap", "items": [{"data": {"to": route, "data": "0xzzzzzzzz"}}]}]})) == "unknown"
    # whitespace-padded calldata: bytes.fromhex() would skip the spaces (0 or 1 decoded bytes, no
    # selector), yet the string is long enough to pass a bare length gate -> must still be unknown
    assert status(resp(200, {"steps": [{"id": "swap", "items": [{"data": {"to": route, "data": "0x        "}}]}]})) == "unknown"
    assert status(resp(200, {"steps": [{"id": "swap", "items": [{"data": {"to": route, "data": "0x12      "}}]}]})) == "unknown"
    # a non-approve tx that is NOT in a swap-identified step (e.g. a deposit) does not establish a route
    assert status(resp(200, {"steps": [{"id": "deposit", "items": [{"data": {"to": route, "data": swap}}]}]})) == "unknown"
    # a wrong-chain leg or a non-numeric value is not a usable 4663 route
    assert status(resp(200, {"steps": [swapstep(chainId=1)]})) == "unknown"
    assert status(resp(200, {"steps": [swapstep(value="not-a-number")]})) == "unknown"
    # strict quantity validation: int() would truncate/accept these, valid_uint/is_chain_4663 reject them
    assert status(resp(200, {"steps": [swapstep(chainId=4663.9)]})) == "unknown"   # truncates to 4663 under int()
    assert status(resp(200, {"steps": [swapstep(value="-1")]})) == "unknown"       # negative
    assert status(resp(200, {"steps": [swapstep(value=0.5)]})) == "unknown"        # fractional
    assert status(resp(200, {"steps": [swapstep(value=True)]})) == "unknown"       # bool is not a quantity
    # a SIGNATURE-kind step never counts as a route, even with a swap-shaped item
    sig = {"kind": "signature", "items": [{"data": {"to": route, "data": swap}}]}
    assert status(resp(200, {"steps": [sig]})) == "unknown"
    # but a signature step alongside a real swap step still routes (the swap counts, the signature is ignored)
    assert status(resp(200, {"steps": [sig, swapstep()]})) == "routes"
    # error codes classify as currency vs no-route vs unknown; 429 is infra unknown
    assert status(resp(400, {"errorCode": "UNSUPPORTED_CURRENCY"})) == "currency_rejected"
    assert status(resp(400, {"errorCode": "INVALID_INPUT_CURRENCY"})) == "currency_rejected"
    assert status(resp(400, {"errorCode": "NO_SWAP_ROUTES_FOUND"})) == "no_route"
    assert status(resp(400, {"errorCode": "FORBIDDEN"})) == "unknown"
    assert status(resp(429, {})) == "unknown"


def test_sellability_skip_probes_deepest_counterpart(monkeypatch, capsys):
    # When there is no WETH route, the snippet PROBES the deepest NON-WETH counterpart via Relay before
    # concluding (the QQQ Stock-Token case). It must classify the counterpart honestly and never claim
    # a funding switch works, or a proven route, without a validated quote.
    import sellability as sell
    tok = "0x" + "5" * 40
    monkeypatch.setattr(sell, "require_chain_4663", lambda: None)
    monkeypatch.setattr(sell, "relay_quote", lambda o, d, a: ([], "UNSUPPORTED_CURRENCY"))  # no WETH route
    monkeypatch.setattr(sell, "discover_quotes", lambda t: [{"symbol": "USDG", "address": "0x" + "9" * 40}])
    monkeypatch.setattr(sell, "erc20_decimals", lambda a: 6)

    def run(status):
        monkeypatch.setattr(sell, "relay_pair_status", lambda o, d, a: status)
        with pytest.raises(SystemExit) as ei:
            sell.main(tok)
        assert ei.value.code == 7
        return capsys.readouterr().out.lower()

    a = run("currency_rejected")                      # counterpart also rejected -> region-restricted signal
    assert "region-" in a and "stock token" in a      # names the real reason, not "fund with USDG"
    assert "relay does route" in run("routes")        # validated route -> fund from it
    assert "no confirmable route" in run("no_route")  # no route at params -> not proven either way
    assert "no confirmable route" in run("unknown")   # infra -> honest UNKNOWN

    # if WETH is the ONLY Dexscreener counterpart there is no other asset to probe
    monkeypatch.setattr(sell, "discover_quotes", lambda t: [{"symbol": "WETH", "address": sell.WETH}])
    with pytest.raises(SystemExit) as ei:
        sell.main(tok)
    assert ei.value.code == 7
    assert "no other dexscreener counterpart" in capsys.readouterr().out.lower()


def test_sellability_buy_revert_parks_at_7(monkeypatch, capsys):
    # A blocked/reverted buy is a token/pool outcome, not infra: it must PARK at exit 7 (was a bare
    # SystemExit -> exit 1, which a retry-classifying bot would keep retrying).
    import sellability as sell
    tok = "0x" + "4" * 40
    monkeypatch.setattr(sell, "require_chain_4663", lambda: None)
    monkeypatch.setattr(sell, "relay_quote", lambda o, d, a: ([{"to": tok, "data": "0x"}], 10**21))
    monkeypatch.setattr(sell, "rpc", lambda m, p, **k: "0x10" if m == "eth_blockNumber"
                        else {"timestamp": "0x5", "baseFeePerGas": "0x1"})
    monkeypatch.setattr(sell, "_simulate", lambda calls, b, t, bf: [{"status": "0x0", "logs": []}])
    with pytest.raises(SystemExit) as ei:
        sell.main(tok)
    assert ei.value.code == 7
    assert "buy blocked" in capsys.readouterr().out.lower()


def test_sellability_warns_on_punitive_tax_but_stays_exit_0(monkeypatch, capsys):
    # A punitive-tax token (like the WSB honeypot at a routable size): the sell SETTLES but returns
    # almost nothing (~9939 bps friction). Per the owner's call this stays exit 0 (it IS sellable),
    # but MUST print a stark SEVERE ROUND-TRIP FRICTION warning so a human/bot gates on friction.
    import sellability as sell
    tok = "0x" + "3" * 40
    W, WALLET = sell.WETH, sell.WALLET
    word = lambda n: "0x" + n.to_bytes(32, "big").hex()
    topic = lambda a: "0x" + "0" * 24 + a[2:].lower()
    zero = "0x" + "0" * 40
    tt = sell.TRANSFER_TOPIC
    B, S, back = 10**21, sell.FUND_WEI, 10**11        # buy 1e21 base for FUND_WEI; sell returns ~nothing
    want = B * 98 // 100
    xfer = lambda taddr, frm, to, amt: {"address": taddr, "topics": [tt, topic(frm), topic(to)], "data": word(amt)}
    buy_leg = {"status": "0x1", "logs": [xfer(tok, zero, WALLET, B), xfer(W, WALLET, zero, S)]}
    sell_leg = {"status": "0x1", "logs": [xfer(tok, WALLET, zero, want), xfer(W, zero, WALLET, back)]}

    monkeypatch.setattr(sell, "require_chain_4663", lambda: None)
    monkeypatch.setattr(sell, "relay_quote", lambda o, d, a: ([{"to": tok, "data": "0x"}], B))
    monkeypatch.setattr(sell, "rpc", lambda m, p, **k: "0x10" if m == "eth_blockNumber"
                        else {"timestamp": "0x5", "baseFeePerGas": "0x1"})
    monkeypatch.setattr(sell, "_simulate",
                        lambda calls, block, t, bf: [buy_leg] if len(calls) == 1 else [buy_leg, sell_leg])

    sell.main(tok)                                    # clean settle -> returns normally (exit 0), no raise
    out = capsys.readouterr().out
    assert "SEVERE ROUND-TRIP FRICTION" in out and "gate on friction" in out.lower()


def test_pool_id_matches_a_live_chain_vector():
    # A real (params -> poolId) vector captured from a live 4663 Initialize log.
    assert common.pool_id("0x0000000000000000000000000000000000000000",
                          "0x867FE66529cB8e428eFCE6047Fd52C7DEfE22976",
                          10000, 200, "0x0000000000000000000000000000000000000000") == \
        "0xc58a07744cd2161c68bcc75f4aba91c3245d23c65154cdcb7b10f2c22c780049"


def test_pool_liquidity_reads_low_uint128_and_propagates_infra(monkeypatch):
    pid = "0x" + "ab" * 32
    word = (7 << 128) | 12345                       # high bits set; low uint128 = 12345
    monkeypatch.setattr(common, "rpc", lambda m, p, **k: "0x" + word.to_bytes(32, "big").hex())
    assert common.pool_liquidity(pid) == 12345
    zero = "0x" + (0).to_bytes(32, "big").hex()                  # a full 32-byte zero word
    monkeypatch.setattr(common, "rpc", lambda m, p, **k: zero)
    assert common.pool_liquidity(pid) == 0                        # genuine 0 = not-liquid at the tick
    monkeypatch.setattr(common, "rpc", lambda m, p, **k: "0x")   # undersized/empty result -> UNKNOWN
    with pytest.raises(SystemExit):
        common.pool_liquidity(pid)
    def boom(*a, **k):
        raise SystemExit("rpc down")
    monkeypatch.setattr(common, "rpc", boom)                     # infra failure -> UNKNOWN (raises), never 0
    with pytest.raises(SystemExit):
        common.pool_liquidity(pid)


def test_probe_amount_single_source():
    import common, quote as qq
    # one definition, imported everywhere: the relocation to common must not fork the sizing
    assert common.probe_amount is qq.probe_amount
    assert [common.probe_amount(d) for d in (18, 6, 8, 24, 0)] == [10**16, 25*10**6, 10**6, 10**22, 1]


def test_watch_classify_labels_base_vs_token():
    import watch, common
    tok = "0x" + "9" * 40
    token, cp, base, kind = watch._classify(common.WETH, tok)
    assert kind == "routable" and base == "WETH" and token == tok and cp == common.WETH
    token, cp, base, kind = watch._classify(tok, common.USDG)         # base can be currency1
    assert kind == "routable" and base == "USDG" and token == tok
    assert watch._classify("0x"+"a"*40, "0x"+"b"*40)[3] == "no_base"  # neither side is a known base
    assert watch._classify(common.WETH, common.USDG)[3] == "base_base"


def test_watch_detect_liq_states(monkeypatch):
    import watch, common
    pid = "0x" + "ab" * 32
    monkeypatch.setattr(common, "rpc", lambda m, p, **k: "0x" + (5).to_bytes(32, "big").hex())
    assert watch._detect_liq(pid) == "LIVE"
    monkeypatch.setattr(common, "rpc", lambda m, p, **k: "0x" + (0).to_bytes(32, "big").hex())
    assert watch._detect_liq(pid) == "EMPTY"
    def boom(*a, **k):
        raise SystemExit("rpc down")
    monkeypatch.setattr(common, "rpc", boom)                          # an RPC failure is UNK, never "EMPTY"
    assert watch._detect_liq(pid) == "UNK"


def test_erc20_decimals_rejects_non_uint8(monkeypatch):
    def fake_rpc(method, params, **k):
        if method == "eth_chainId":
            return hex(4663)
        if method == "eth_call":
            return hex(256)                 # decimals() returning > uint8
        raise AssertionError(method)
    monkeypatch.setattr(common, "rpc", fake_rpc)
    with pytest.raises(SystemExit):
        common.erc20_decimals("0x" + "3" * 40)   # not a known asset -> reads on-chain


def test_dex_pairs_distinguishes_failure_from_empty(monkeypatch):
    def resp(status, body):
        return type("R", (), {"status_code": status, "json": lambda self: body})()
    monkeypatch.setattr(common.httpx, "get", lambda *a, **k: resp(429, []))
    with pytest.raises(SystemExit):            # a 429 is UNKNOWN, not "no pools"
        common.dex_pairs("0x" + "2" * 40)
    monkeypatch.setattr(common.httpx, "get", lambda *a, **k: resp(200, []))
    assert common.dex_pairs("0x" + "2" * 40) == []   # a genuine empty result
    monkeypatch.setattr(common.httpx, "get", lambda *a, **k: resp(200, [{}]))
    with pytest.raises(SystemExit):                  # a malformed pair (no token addresses) is UNKNOWN
        common.dex_pairs("0x" + "2" * 40)


def test_quote_error_taxonomy(monkeypatch):
    import quote as q
    monkeypatch.setattr(q, "erc20_decimals", lambda a: 18)
    tok, qa = "0x" + "2" * 40, q.checksum("0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73")
    def post(status, code):
        body = {"errorCode": code} if code else {}
        monkeypatch.setattr(q.httpx, "post", lambda *a, **k: type("R", (), {"status_code": status, "json": lambda self: body})())
    def msg(status, code):
        post(status, code)
        with pytest.raises(SystemExit) as ei:
            q.quote(tok, qa)
        return str(ei.value)
    assert "smaller size" in msg(400, "SWAP_IMPACT_TOO_HIGH")          # size problem, not indexing
    assert "larger size" in msg(400, "AMOUNT_TOO_LOW")                 # below-minimum => larger
    m = msg(400, "UNSUPPORTED_CURRENCY"); assert "UNKNOWN" in m and "watch.py" not in m   # ambiguous, not no-route
    assert "watch.py" in msg(400, "NO_SWAP_ROUTES_FOUND")             # genuine no-route => indexing advice
    assert "retry" in msg(429, "")                                     # infra => retry, not no-route
    assert "UNKNOWN" in msg(403, "FORBIDDEN")                          # validation/permission => routing UNKNOWN


def test_quote_rejects_malformed_or_swapless_route(monkeypatch, capsys):
    import quote as q
    monkeypatch.setattr(q, "erc20_decimals", lambda a: 18)
    tok, qa = "0x" + "2" * 40, q.checksum("0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73")
    route = "0x" + "cc" * 20
    approve = q.APPROVE_SELECTOR + "0" * 24 + "1" * 40 + "0" * 64       # approve(spender, amt)
    def ok200(steps):
        monkeypatch.setattr(q.httpx, "post", lambda *a, **k: type("R", (), {"status_code": 200, "json": lambda self: {"steps": steps}})())
    # a step whose item has no target/calldata must NOT print "target None" and succeed
    ok200([{"id": "swap", "items": [{"data": {}}]}])
    with pytest.raises(SystemExit):
        q.quote(tok, qa)
    # a non-empty but INVALID target ("not-an-address") with stub calldata must be rejected, not printed
    ok200([{"id": "swap", "items": [{"data": {"to": "not-an-address", "data": "0x"}}]}])
    with pytest.raises(SystemExit):
        q.quote(tok, qa)
    # a valid target but too-short calldata (no 4-byte selector) is unusable
    ok200([{"id": "swap", "items": [{"data": {"to": route, "data": "0x"}}]}])
    with pytest.raises(SystemExit):
        q.quote(tok, qa)
    # whitespace-padded calldata (bytes.fromhex would skip spaces -> no real selector) is unusable
    ok200([{"id": "swap", "items": [{"data": {"to": route, "data": "0x        "}}]}])
    with pytest.raises(SystemExit):
        q.quote(tok, qa)
    # an empty items list is an unusable route
    ok200([{"id": "swap", "items": []}])
    with pytest.raises(SystemExit):
        q.quote(tok, qa)
    # approve-only (no swap target) is incomplete -> UNKNOWN
    ok200([{"id": "approve", "items": [{"data": {"to": route, "data": approve}}]}])
    with pytest.raises(SystemExit):
        q.quote(tok, qa)
    # a real approve + swap route prints and returns normally (no raise)
    ok200([{"id": "approve", "items": [{"data": {"to": route, "data": approve}}]},
           {"id": "swap", "items": [{"data": {"to": route, "data": "0xdeadbeef"}}]}])
    q.quote(tok, qa)
    out = capsys.readouterr().out
    assert "approve spender" in out and "target" in out and "None" not in out


def test_mark_na_when_token_is_not_the_base(monkeypatch, capsys):
    import mark
    tok = "0x" + "2" * 40
    # a pair where our token is the QUOTE, not the base -> must print n/a, not the base's price
    monkeypatch.setattr(mark, "dex_pairs", lambda t: [
        {"baseToken": {"address": "0x" + "9" * 40}, "quoteToken": {"address": tok},
         "priceUsd": "0.01", "liquidity": {"usd": 999}}])
    mark.mark(tok)
    assert "n/a" in capsys.readouterr().out.lower()
