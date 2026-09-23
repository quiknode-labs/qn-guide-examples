"""Prove a Robinhood Chain token is SELLABLE, not just buyable. Read-only simulation.

A buy that succeeds does NOT prove you can sell. Honeypots, punitive taxes, and hostile v4
hooks block exits. This proves sellability in two steps, both read-only:

  1. Simulate the buy alone and MEASURE the base actually acquired (from the traced logs).
  2. Reverse-quote for that measured amount, then simulate buy-then-sell in one sequence with
     state carried across the legs.

Sizing the reverse-sell from the MEASURED base (not the quoted estimate) is deliberate: it
stops a slippage shortfall from reverting the sell and reading as a false honeypot. Measuring the
base avoids the insufficient-balance shortfall from sizing on an overstated quote, but it
does not rule out every shortfall (a sender-tax token can debit MORE than the requested amount), and
a revert can still come from slippage, a deadline, an approval, or routing. So a failed reverse-sell
means sellability is UNPROVEN -- a SUSPECT signal at this size, not a honeypot diagnosis.

Funding uses a native-ETH balance override plus WETH.deposit(), which is layout-independent:
real 4663 tokens do not keep balances at a guessable storage slot, so a stateDiff balance
override silently misses. This handles WETH-quoted routes. It rejects native-value routes,
because it accounts for WETH only.

Honesty: deltas are LOG-derived, not authenticated balance diffs, and the sim proves
sellability only at the current block, for this size, and in a SIMULATED execution context
(head state + timestamp + base fee). Pinning the base fee closes the zero-gas-price edge case,
but the sim still cannot reproduce Arbitrum's full L1-data-fee and ArbOS gas accounting, so treat
the result as conditional on that context. See the guide's sellability section.

    QUICKNODE_RPC=https://... python snippets/sellability.py 0x6245e67affA44a23077f0Ea7f981a8DC743a0c47
"""

from __future__ import annotations

import sys

import httpx
from eth_utils import is_address, keccak, to_checksum_address

from common import (CHAIN_ID, NATIVE_ETH, WETH, checksum, discover_quotes, erc20_decimals,
                    is_chain_4663, probe_amount, require_chain_4663, rpc, valid_calldata, valid_uint)

RELAY = "https://api.relay.link/quote/v2"
# Relay errorCodes where a CURRENCY ADDRESS is invalid/unsupported: a genuine "no route" for this
# WETH pair (the WETH-quote skip case). NOTE: UNSUPPORTED_CURRENCY is deliberately NOT here -- Relay
# documents it as "not supported for input or output, OR the token pair cannot be priced," which is
# ambiguous (and the pricing case can be transient), so it is handled as UNKNOWN below.
NO_ROUTE_CURRENCY_CODES = {"INVALID_INPUT_CURRENCY", "INVALID_OUTPUT_CURRENCY"}
# Relay errorCodes that mean Relay cannot fill the request AS PARAMETERIZED (no quote/route, thin or
# one-sided liquidity, amount below the minimum, or price impact/amount over the ceiling). These are
# request/pool conditions, not our infra, so the snippet PARKS each (exit 7), never a pass. Whether a
# retry helps depends on the reason, not the code alone: resize for AMOUNT_TOO_LOW (larger) or the
# impact/amount-too-high codes (smaller); a fresh, not-yet-indexed pool may route after a backoff; a
# same-size immediate retry usually will not. The handler branches to give the right per-code hint.
# SWAP_IMPACT_TOO_HIGH is the common signal for a thin or one-sided honeypot-style pool at the probe size.
NO_QUOTE_AT_SIZE_CODES = {"NO_QUOTES", "NO_SWAP_ROUTES_FOUND", "NO_INTERNAL_SWAP_ROUTES_FOUND",
                         "INSUFFICIENT_LIQUIDITY", "AMOUNT_TOO_LOW", "SWAP_IMPACT_TOO_HIGH", "AMOUNT_TOO_HIGH"}
WALLET = "0x000000000000000000000000000000000000C0DE"
DEPOSIT_SELECTOR = "0xd0e30db0"                                  # WETH deposit()
APPROVE_SELECTOR = "0x095ea7b3"                                  # approve(address,uint256)
TRANSFER_TOPIC = "0x" + keccak(text="Transfer(address,address,uint256)").hex()
FUND_WEI = 20 * 10**15                                           # 0.02 WETH probe
GAS_HEADROOM = hex(100 * 10**18)                                 # native override (gas + deposit)
PUNITIVE_FRICTION_BPS = 5_000                                    # >50% round-trip loss = punitive-tax alarm


def _hexval(v) -> str:
    # Match valid_uint()'s case-INSENSITIVE 0x rule: a "0X.." string passes valid_uint() but a
    # case-sensitive v.startswith("0x") here would fall through to decimal int() and raise, crashing
    # (exit 1) a value that should reach the native-value park (exit 7). int(_, 16) is case-insensitive.
    if isinstance(v, str) and v[:2].lower() == "0x":
        return v
    return hex(int(v or 0))


def relay_quote(origin: str, dest: str, amount: int):
    """Request an EXACT_INPUT route. Returns:
      (calls, amount_out) - a routable approve+swap route (calls is a non-empty list),
      ([], code)          - Relay has no routable quote for this WETH pair (the errorCode string;
                            UNSUPPORTED_CURRENCY is AMBIGUOUS: unsupported OR merely unpriceable),
      (None, None)        - a route this snippet cannot simulate (a permit/signature step, or a
                            transaction step with no usable calldata) -> caller reports UNKNOWN.
    A size/impact code (no quote, thin or one-sided liquidity, price impact too high) prints and
    exits 7 (PARK: sellability at this size is UNKNOWN, a smaller size may quote). A rate limit,
    server error, or any other failure raises routing UNKNOWN (exit 1, retryable), not a route
    absence. A route call carrying native value is rejected: this WETH-only probe accounts for WETH."""
    body = {"user": WALLET, "recipient": WALLET, "originChainId": CHAIN_ID,
            "destinationChainId": CHAIN_ID, "originCurrency": origin, "destinationCurrency": dest,
            "amount": str(amount), "tradeType": "EXACT_INPUT", "slippageTolerance": "100"}
    r = httpx.post(RELAY, json=body, timeout=20)
    if r.status_code == 429 or r.status_code >= 500:
        raise SystemExit(f"Relay quote unavailable (HTTP {r.status_code}); routing UNKNOWN, retry with backoff")
    if r.status_code >= 400:
        code = ""
        try:
            code = (r.json() or {}).get("errorCode") or ""
        except ValueError:
            pass
        if code in NO_ROUTE_CURRENCY_CODES or code == "UNSUPPORTED_CURRENCY":
            # No routable WETH quote for this pair; carry the code so the caller reports it honestly.
            # INVALID_*_CURRENCY = the currency address is invalid/unsupported. UNSUPPORTED_CURRENCY is
            # AMBIGUOUS: Relay documents it as "not supported for input or output, OR the token pair
            # cannot be priced" (which can be transient), so it does NOT prove a permanent route
            # absence, and the caller must not imply a funding-asset switch necessarily resolves it.
            return [], code
        if code in NO_QUOTE_AT_SIZE_CODES:
            # Relay cannot fill this request as parameterized. Park it (exit 7): sellability at this
            # size is UNKNOWN, not a pass and not a retryable infra error. The right next step depends
            # on the code, so do NOT give one categorical "smaller size" hint for all of them.
            if code == "AMOUNT_TOO_LOW":
                hint = "the amount is BELOW Relay's minimum; a LARGER size may quote"
            elif code in ("SWAP_IMPACT_TOO_HIGH", "AMOUNT_TOO_HIGH", "INSUFFICIENT_LIQUIDITY"):
                hint = "price impact/amount over the ceiling or liquidity too thin for this size; a SMALLER size may quote"
            else:   # NO_QUOTES, NO_SWAP_ROUTES_FOUND, NO_INTERNAL_SWAP_ROUTES_FOUND
                hint = "Relay has no quote or route for these parameters"
            print(f"Relay cannot fill this request (code {code}): {hint}. sellability at this size "
                  f"UNKNOWN; park (not a pass, not a retryable infra error).")
            raise SystemExit(7)
        raise SystemExit(f"Relay quote failed (HTTP {r.status_code}, {code or 'error'}); routing UNKNOWN")
    q = r.json()
    if not isinstance(q, dict):
        raise SystemExit("Relay returned an unexpected (non-object) 200 body; routing UNKNOWN")
    steps = q.get("steps")
    if not isinstance(steps, list) or not steps:
        # A 200 with no steps is unexpected (genuine no-route arrives as a 4xx errorCode above),
        # so treat it as UNKNOWN rather than assert route absence.
        raise SystemExit("Relay 200 response had no steps; routing UNKNOWN")
    calls = []
    for step in steps:
        if step.get("kind") == "signature":
            return None, None                  # a permit/signature route: not simulated here
        for item in step.get("items", []):
            d = item.get("data") or {}
            to, data = d.get("to"), d.get("data")
            if not (isinstance(to, str) and is_address(to) and valid_calldata(data)):
                return None, None              # targetless/malformed/whitespace-padded item -> caller reports UNKNOWN
            cid = d.get("chainId")
            if cid is not None and not is_chain_4663(cid):
                # A cross-chain / wrong-chain leg would be simulated against 4663 state (different
                # contracts): refuse it rather than mis-report the result as 4663 sellability.
                raise SystemExit(f"route leg targets chain {cid}, not {CHAIN_ID}; cannot simulate it "
                                 f"on 4663, routing UNKNOWN")
            raw_value = d.get("value")
            if raw_value is not None and not valid_uint(raw_value):
                # _hexval() would coerce 0.5/-0.5/False to "0x0", silently turning a malformed value
                # into a zero-value call and bypassing the native-value rejection below. Refuse it.
                raise SystemExit(f"route leg has an invalid tx value {raw_value!r}; routing UNKNOWN")
            value = _hexval(raw_value)
            if int(value, 16) != 0:
                # Out of scope for this WETH-only probe, not a retryable infra error: park (exit 7).
                print("route carries native value; this WETH-only probe does not support native-input")
                print("routes (see the guide). sellability UNKNOWN for this route; park.")
                raise SystemExit(7)
            calls.append({"from": WALLET, "to": to_checksum_address(to), "value": "0x0", "data": data})
    if not calls:
        return None, None
    out = (((q.get("details") or {}).get("currencyOut") or {}).get("amount"))
    return calls, (int(out) if out else None)


def relay_pair_status(origin: str, dest: str, amount: int) -> str:
    """Side-effect-free classification of a Relay origin->dest probe. Returns one of:
      'routes'            - a validated 200 with usable swap steps (a route provably exists),
      'currency_rejected' - UNSUPPORTED_CURRENCY / INVALID_*_CURRENCY (the pair, or one currency,
                            is not supported; UNSUPPORTED_CURRENCY is ambiguous and may be transient),
      'no_route'          - no quote/route at these parameters (NO_QUOTES, NO_SWAP_ROUTES_FOUND,
                            NO_INTERNAL_SWAP_ROUTES_FOUND, INSUFFICIENT_LIQUIDITY, impact/amount): a
                            route is NOT proven, and a different size might change it,
      'unknown'           - transport/infra (429/5xx/timeout), an empty 200, or an unclassified error.
    It never prints and never exits, so it is safe to probe an ALTERNATE funding asset with it. A
    non-currency error is NOT treated as a proven route (that was a prior overstatement)."""
    body = {"user": WALLET, "recipient": WALLET, "originChainId": CHAIN_ID,
            "destinationChainId": CHAIN_ID, "originCurrency": origin, "destinationCurrency": dest,
            "amount": str(amount), "tradeType": "EXACT_INPUT", "slippageTolerance": "100"}
    try:
        r = httpx.post(RELAY, json=body, timeout=20)
    except httpx.HTTPError:
        return "unknown"
    if r.status_code == 429 or r.status_code >= 500:
        return "unknown"
    if r.status_code >= 400:
        code = ""
        try:
            body = r.json()
            code = (body.get("errorCode") or "") if isinstance(body, dict) else ""
        except ValueError:
            pass
        if code in ("UNSUPPORTED_CURRENCY", "INVALID_INPUT_CURRENCY", "INVALID_OUTPUT_CURRENCY"):
            return "currency_rejected"
        if code in ("NO_QUOTES", "NO_SWAP_ROUTES_FOUND", "NO_INTERNAL_SWAP_ROUTES_FOUND",
                    "INSUFFICIENT_LIQUIDITY", "SWAP_IMPACT_TOO_HIGH", "AMOUNT_TOO_HIGH", "AMOUNT_TOO_LOW"):
            return "no_route"
        return "unknown"
    if r.status_code != 200:
        return "unknown"                    # a 2xx-but-not-200 (e.g. 202) or a redirect is not a route
    # 'routes' requires a real 200 whose steps are ALL well-formed and include at least one usable,
    # non-approve SWAP transaction (valid target + hex calldata carrying >= a 4-byte selector). A
    # malformed item, an approval-only route, a signature-only route, or an empty body is UNKNOWN.
    try:
        q = r.json()
    except ValueError:
        return "unknown"
    if not isinstance(q, dict) or not isinstance(q.get("steps"), list):
        return "unknown"
    saw_swap = False
    try:
        for step in q["steps"]:
            if not isinstance(step, dict):
                return "unknown"
            if step.get("kind") == "signature":
                continue                    # a signature step carries typed data, not a swap tx: never a route
            sid = (step.get("id") or step.get("action") or "").lower()
            items = step.get("items") or []
            if not items:
                return "unknown"            # a non-signature step with no transaction items is malformed
            for item in items:
                d = item.get("data") or {}
                to, data = d.get("to"), d.get("data")
                if not (isinstance(to, str) and is_address(to) and valid_calldata(data)):
                    return "unknown"        # a malformed/targetless/whitespace-padded item -> not a route
                raw = bytes.fromhex(data[2:])   # valid_calldata guarantees pure even-length hex
                cid = d.get("chainId")
                if cid is not None and not is_chain_4663(cid):
                    return "unknown"        # a cross-chain/wrong-chain leg (incl. 4663.9) is not a 4663 route
                val = d.get("value")
                if val is not None and not valid_uint(val):
                    return "unknown"        # value must be an unsigned bounded integer (rejects -1, 0.5, bool)
                if data.lower().startswith(APPROVE_SELECTOR):
                    if len(raw) < 4 + 64:   # selector + (address, uint256): a truncated approve is malformed
                        return "unknown"
                    if any(raw[4:16]):      # nonzero upper-12 bytes of the spender word = invalid ABI
                        return "unknown"    # address padding; quote.py's abi_decode rejects the same
                elif "swap" in sid:         # count only a non-approve tx in a Relay swap-identified step
                    saw_swap = True
    except (ValueError, TypeError, AttributeError):
        return "unknown"
    return "routes" if saw_swap else "unknown"


def _topic_addr(topic: str) -> str:
    """An address from a 32-byte log topic, rejecting nonzero upper-12-byte padding."""
    b = bytes.fromhex(topic[2:] if topic.startswith("0x") else topic)
    if len(b) != 32 or any(b[:12]):
        raise ValueError("address topic has nonzero padding")
    return to_checksum_address(b[12:])


def token_delta(call_results, token: str, wallet: str) -> int:
    """Net signed delta of `token` for `wallet`, from emitted Transfer logs (log-derived). A log
    from the token with the Transfer topic0 but a NON-standard shape (not exactly 3 topics, bad
    address padding, or data that is not one 32-byte word) is malformed: rather than count a wrong
    amount, fail closed with UNKNOWN. (This is a decoding guard; a well-formed log can still lie.)"""
    tok, w, delta = to_checksum_address(token), to_checksum_address(wallet), 0
    for c in call_results:
        for log in (c.get("logs") or []):
            try:
                if to_checksum_address(log.get("address", "")) != tok:
                    continue
            except (ValueError, TypeError):
                continue
            t = log.get("topics") or []
            if not t or t[0].lower() != TRANSFER_TOPIC:
                continue
            try:
                data = log.get("data") or "0x"
                if len(t) != 3 or len(bytes.fromhex(data[2:])) != 32:   # standard ERC-20 Transfer shape
                    raise ValueError("non-standard Transfer shape")
                frm, to = _topic_addr(t[1]), _topic_addr(t[2])
                amt = int(data, 16)
            except (ValueError, TypeError):
                # A non-standard Transfer is a token property (suspect), not our infra: park (exit 7).
                print("malformed Transfer event from the token; delta UNKNOWN. sellability UNKNOWN; park.")
                raise SystemExit(7)
            if to == w:
                delta += amt
            if frm == w:
                delta -= amt
    return delta


def _revert_reason(call: dict) -> str:
    err = call.get("error")
    if isinstance(err, dict) and err.get("message"):
        return str(err["message"])
    return "reverted"


def _simulate(calls: list, block: str, time_hex: str, base_fee_hex: str) -> list:
    """Run [deposit funding leg, *calls] through one eth_simulateV1 with a native-ETH override,
    PINNED to `block` (parent state), `time_hex` (the simulated block's timestamp), AND
    `base_fee_hex` (the head block's gas price). Pinning the time matters: eth_simulateV1 otherwise
    advances the child block ~12 s past the parent, so a time-gated restriction (an anti-snipe fee
    decay, a launch cooldown) could read as expired when it is still active at head. Pinning the base
    fee matters too: with validation off and no fee fields the sim runs at ZERO gas price, so a token
    gating exits on `tx.gasprice == 0` or reading `block.basefee` could pass this probe yet block a
    normal paid sale. Setting the head base fee (and a matching per-call maxFeePerGas) makes GASPRICE
    and BASEFEE realistic and nonzero. Returns the MEASURED call results (deposit leg excluded)."""
    deposit = {"from": WALLET, "to": WETH, "value": hex(FUND_WEI), "data": DEPOSIT_SELECTOR}
    # maxFeePerGas == base fee, zero priority: effective gasprice == base fee (nonzero, realistic).
    priced = [{**c, "maxFeePerGas": base_fee_hex, "maxPriorityFeePerGas": "0x0"}
              for c in (deposit, *calls)]
    payload = {
        "blockStateCalls": [{
            "blockOverrides": {"time": time_hex, "baseFeePerGas": base_fee_hex},   # head time + gas price
            "stateOverrides": {WALLET: {"balance": GAS_HEADROOM}},   # native, layout-independent
            "calls": priced,
        }],
        "traceTransfers": True,
        "validation": False,           # read-only delta sim; not a broadcast
    }
    result = rpc("eth_simulateV1", [payload, block])
    blk = (result[0] or {}) if isinstance(result, list) and result else {}
    got = blk.get("calls")
    if not isinstance(got, list) or len(got) != 1 + len(calls):
        raise SystemExit("sellability sim returned no usable results (is eth_simulateV1 served here?)")
    if not isinstance(got[0], dict) or got[0].get("status") != "0x1":
        # The WETH.deposit() funding leg itself failed; nothing downstream is fundable, so any
        # later "insufficient funds" revert would be a probe artifact, not the token's fault.
        raise SystemExit(f"WETH.deposit() funding leg failed ({_revert_reason(got[0] if got else {})}); "
                         f"probe inconclusive")
    return got[1:]     # exclude the deposit funding leg from measured deltas


def main(token: str) -> None:
    token = checksum(token)
    require_chain_4663()       # the sim must run on 4663; the Relay chainId does not bind this RPC
    buy_calls, buy_code = relay_quote(WETH, token, FUND_WEI)
    if buy_calls is None:
        print(f"{token}\n  the WETH route needs a permit/signature step (or has unusable calldata).")
        print("  this snippet simulates approve+swap routes only, so sellability is UNKNOWN here.")
        raise SystemExit(7)
    if not buy_calls:
        # No WETH route. Cross-check with ONE Relay probe of the deepest non-WETH counterpart, then
        # report what Relay returned. A currency rejection on both usually means a region-restricted
        # Stock Token (Relay geo-gates them); do not claim a funding switch fixes it.
        quotes = discover_quotes(token)
        print(f"{token}\n  no usable WETH quote (Relay: {buy_code or 'no route'}).")
        cp = next((x for x in (quotes or []) if x["address"].lower() != WETH.lower()), None)
        if cp is None:
            print("  no other Dexscreener counterpart to probe. verify with quote.py. sellability UNKNOWN.")
            raise SystemExit(7)
        cp_name = cp["symbol"] or cp["address"]
        try:
            status = relay_pair_status(cp["address"], token, probe_amount(erc20_decimals(cp["address"])))
        except SystemExit:
            status = "unknown"
        if status == "currency_rejected":
            print(f"  Relay also rejects the currency for its deepest non-WETH counterpart ({cp_name}).")
            print("  neither tested pair produced a usable quote, and UNSUPPORTED_CURRENCY can also mean")
            print("  the pair is temporarily unpriceable; other funding assets remain untested. common")
            print("  causes: a region-restricted Stock Token (geo-gated) or a pair Relay does not support.")
            print("  verify with quote.py against your intended funding asset. sellability UNKNOWN here.")
        elif status == "routes":
            fund = ("native balance funding plus the route's own call value"
                    if cp["address"].lower() == NATIVE_ETH.lower()
                    else f"a per-token storage override for {cp_name}")
            print(f"  but Relay DOES route it from {cp_name} (its deepest counterpart). this snippet funds")
            print(f"  WETH only, so a {cp_name}-funded quote needs a separate simulated funding method")
            print(f"  ({fund}). see the guide.")
        else:   # no_route / unknown: not a currency reject, not a proven route
            print(f"  and Relay gave no confirmable route from {cp_name} ({status}). routing UNKNOWN;")
            print("  verify with quote.py. sellability UNKNOWN here.")
        raise SystemExit(7)     # not proven sellable -> nonzero, so a gate never treats it as a pass

    # Pin ONE parent block for both sims, so the measured base from step 1 is exactly the base
    # available in step 2 (a block mined between two "latest" calls could otherwise shift it and
    # revert the sell for insufficient balance, reading as a false honeypot). Also read that block's
    # timestamp and pin the simulated time to it, so the sim runs at head time, not ~12 s ahead.
    block = rpc("eth_blockNumber", [])
    head = rpc("eth_getBlockByNumber", [block, False])
    time_hex = (head or {}).get("timestamp")
    base_fee = (head or {}).get("baseFeePerGas")
    if not isinstance(time_hex, str) or not isinstance(base_fee, str):
        raise SystemExit("could not read the head block timestamp/base fee; UNKNOWN")

    # Step 1: simulate the buy alone and MEASURE the base actually acquired.
    buy_only = _simulate(buy_calls, block, time_hex, base_fee)
    if any(c.get("status") != "0x1" for c in buy_only):
        print(f"{token}\n  buy leg reverted: cannot establish sellability (buy blocked at this size). park.")
        raise SystemExit(7)
    base_bought = token_delta(buy_only, token, WALLET)
    if base_bought <= 0:
        print(f"{token}\n  buy simulated ok but produced NO measurable base (no Transfer to us).")
        print("  sellability is UNKNOWN, not proven. fail closed.")
        raise SystemExit(7)

    # Step 2: reverse-quote for the MEASURED base (small haircut), then sim buy-then-sell on the
    # SAME pinned block. The haircut is safely under the base the buy produces on this block.
    want_sell = base_bought * 98 // 100
    if want_sell <= 0:
        # A 2% haircut of a 1-unit acquisition rounds to zero; a zero-amount reverse quote cannot
        # test sellability and would read as a routing failure. Reachable with tiny/low-decimal buys.
        print(f"{token}\n  buy acquired only {base_bought} raw unit(s): too small for a haircut reverse")
        print("  probe. sellability UNKNOWN at this size; try a larger buy. fail closed.")
        raise SystemExit(7)
    sell_calls, sell_code = relay_quote(token, WETH, want_sell)
    # A reverse-route problem means sellability is UNPROVEN, not an infra error. Park it at exit 7,
    # matching the buy side (a bare raise here would exit 1 and read as retryable).
    if sell_calls is None:
        print(f"{token}\n  the reverse-sell route needs a permit/signature step; this snippet simulates")
        print("  approve+swap routes only, so sellability is UNKNOWN here.")
        raise SystemExit(7)
    if not sell_calls:
        if sell_code == "UNSUPPORTED_CURRENCY":
            # Same ambiguity as the buy side: unsupported OR merely unpriceable (possibly transient).
            # Do not assert the reverse route is permanently absent.
            print(f"{token}\n  reverse-sell quote UNSUPPORTED_CURRENCY (unsupported OR unpriceable; route")
            print("  absence not established; may be transient, retry with backoff). sellability UNKNOWN.")
        else:
            print(f"{token}\n  a WETH buy route exists but no reverse-sell route (Relay: {sell_code or 'no route'});")
            print("  cannot prove sellability.")
        raise SystemExit(7)
    seq = _simulate(buy_calls + sell_calls, block, time_hex, base_fee)
    buy_leg, sell_leg = seq[:len(buy_calls)], seq[len(buy_calls):]
    if any(c.get("status") != "0x1" for c in buy_leg):
        print(f"{token}\n  buy leg reverted on the combined run; inconclusive (not a sellability verdict). park.")
        raise SystemExit(7)

    bought = token_delta(buy_leg, token, WALLET)       # base in, from the combined run
    weth_spent = -token_delta(buy_leg, WETH, WALLET)   # WETH the buy ACTUALLY spent (may be < FUND_WEI)
    if bought < want_sell:
        # Should not happen with a pinned block, but never let a shortfall masquerade as a honeypot.
        print(f"{token}\n  buy produced less base than the reverse leg requests; inconclusive (not a honeypot).")
        raise SystemExit(7)
    if any(c.get("status") != "0x1" for c in sell_leg):
        reason = next((_revert_reason(c) for c in sell_leg if c.get("status") != "0x1"), "reverted")
        print(f"{token}\n  reverse-sell FAILED: {reason}")
        print("  this is the honeypot signal, but a slippage/deadline/approval failure can also")
        print("  revert. treat as SUSPECT (not sellable at this size), not a proven honeypot.")
        raise SystemExit(7)

    base_sold = -token_delta(sell_leg, token, WALLET)  # base out (positive)
    weth_back = token_delta(sell_leg, WETH, WALLET)    # WETH proceeds
    if weth_spent <= 0 or base_sold <= 0 or weth_back <= 0:
        print(f"{token}\n  the round trip produced no measurable spend or proceeds; sellability UNKNOWN. fail closed.")
        raise SystemExit(7)
    if base_sold < want_sell:
        # An EXACT_INPUT sell disposes exactly the requested base. Anything less is a partial fill,
        # and normalizing friction would hide it, so require the full requested size (no tolerance).
        print(f"{token}\n  reverse-sell PARTIAL: disposed {base_sold} of {want_sell} requested base.")
        print("  the exit did not clear the requested size; sellability at this size is UNKNOWN.")
        raise SystemExit(7)
    if weth_spent > FUND_WEI or base_sold > bought:
        # The override seeds native ETH only, so the fixed probe address could hold pre-existing
        # WETH or base. If the buy spent more WETH than we funded, or the sell moved out more base
        # than the buy produced (a sender-tax token can), the probe drew on inventory it did not
        # buy. That is not a clean round trip, so fail closed rather than pass on a subsidy.
        print(f"{token}\n  the probe moved more WETH or base than it funded/bought (spent {weth_spent},")
        print(f"  funded {FUND_WEI}; sold {base_sold}, bought {bought}); it may have used pre-existing")
        print("  balances. sellability INCONCLUSIVE. fail closed.")
        raise SystemExit(7)

    # Per-base friction: WETH out per base SOLD vs WETH in per base BOUGHT, using MEASURED spend
    # (not the funded amount) so a partial-fill refund cannot distort it. Normalizing by base
    # removes the retained-inventory artifact (we sell ~98% of what we bought, not 100%).
    friction_bps = round((1 - (weth_back / base_sold) / (weth_spent / bought)) * 10_000)
    print(token)
    print(f"  buy sim      ok  (spent {weth_spent} raw WETH -> {bought} raw token)")
    print(f"  sell sim     ok  (sold {base_sold} raw token -> {weth_back} raw WETH)")
    print("  exit         the reverse-sell settled for the PROBE ADDRESS at this size (no blocked sell)")
    print(f"  friction     {friction_bps} bps  (net per-base round trip, REPORTED not gated; set your own")
    print("               ceiling: a punitive-tax token settles the sell yet returns almost nothing)")
    if friction_bps >= PUNITIVE_FRICTION_BPS:
        # High friction is a MAGNITUDE, not a diagnosed cause: it bundles the LP/pool fee, price
        # impact, any token tax, and any route/hook fee. So flag the magnitude and name a punitive tax
        # as ONE possible cause, not the verdict. Report ACTUAL cash recovery (weth_back / weth_spent),
        # not the per-base normalized friction, so the percentage is not mistaken for cash returned.
        cash_pct = 100 * weth_back / weth_spent
        sold_pct = 100 * base_sold / bought          # MEASURED disposal, not a hardcoded haircut
        print(f"  WARNING      SEVERE ROUND-TRIP FRICTION at this size (>= {PUNITIVE_FRICTION_BPS} bps): the sell")
        print(f"               returned about {cash_pct:.2f}% of the WETH spent (from disposing {sold_pct:.0f}% of")
        print("               the tokens bought; any retained remainder is not counted here). a punitive")
        print("               token tax is ONE possible cause; an extractive pool fee, price impact, or a")
        print("               hook fee are others. exit stays 0 (it IS sellable), so GATE ON FRICTION here.")
    print("  note         probe address + same parent block (by number) + this size + head base fee;")
    print("               log-derived, not authenticated; a simulated gas context (not full ArbOS/L1")
    print("               fee accounting); a token could permit this address but block other holders")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: python snippets/sellability.py <token-address>")
    main(sys.argv[1])
