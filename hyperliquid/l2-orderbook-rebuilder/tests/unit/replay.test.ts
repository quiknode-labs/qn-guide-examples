import assert from "node:assert/strict";
import test from "node:test";

import fixture from "../fixtures/replay-transitions.json" with { type: "json" };
import type { ReplayBlock, Side } from "../../src/data/types.js";
import { formatDecimal, parseDecimal } from "../../src/replay/decimal.js";
import { OrderBook, type RestingOrder } from "../../src/replay/order-book.js";
import { applyBlockForward, applyBlockReverse } from "../../src/replay/replay.js";

function buildOrders(
  orders: Array<{
    oid: string;
    user: string;
    coin: string;
    side: string;
    px: string;
    sz: string;
  }>,
): RestingOrder[] {
  return orders.map((order) => ({
    ...order,
    side: order.side as Side,
    px: parseDecimal(order.px),
    sz: parseDecimal(order.sz),
  }));
}

const block = fixture.block as unknown as ReplayBlock;

test("reverse replay restores cancel, partial fill, full fill, and same-block add/remove", () => {
  const expected = new OrderBook(buildOrders(fixture.beforeOrders));
  const book = new OrderBook(buildOrders(fixture.afterOrders));

  applyBlockReverse(book, block, fixture.coin);

  assert.equal(book.fingerprint(), expected.fingerprint());
});

test("forward replay returns exactly to the anchor after a reverse replay", () => {
  const anchor = new OrderBook(buildOrders(fixture.afterOrders));
  const book = anchor.clone();

  applyBlockReverse(book, block, fixture.coin);
  applyBlockForward(book, block, fixture.coin);

  assert.equal(book.fingerprint(), anchor.fingerprint());
  assert.deepEqual(book.toL2(), {
    bids: [{ px: "100", sz: "1.7", n: 2 }],
    asks: [{ px: "102", sz: "2", n: 1 }],
  });
});

test("decimal aggregation never uses binary floating point", () => {
  const sum = parseDecimal("0.1") + parseDecimal("0.2");
  assert.equal(formatDecimal(sum), "0.3");
  assert.equal(formatDecimal(parseDecimal(".000000000000000001")), "0.000000000000000001");
});

test("reverse replay fails closed when a removal size is unrecoverable", () => {
  const book = new OrderBook();
  const removeOnly: ReplayBlock = {
    blockNumber: 456,
    blockTime: "2026-07-16T00:00:00",
    orderEvents: [],
    bookEvents: [
      {
        user: "0x0000000000000000000000000000000000000007",
        oid: 7,
        coin: "BTC",
        side: "B",
        px: "97",
        raw_book_diff: "remove",
      },
    ],
  };

  assert.throws(
    () => applyBlockReverse(book, removeOnly, "BTC"),
    /Cannot uniquely recover removed size/,
  );
});

test("round-trips a same-oid price-changing cancel-replace sequence", () => {
  const user = "0x0000000000000000000000000000000000000008";
  const before = new OrderBook([
    {
      oid: "8",
      user,
      coin: "BTC",
      side: "B",
      px: parseDecimal("99"),
      sz: parseDecimal("5"),
    },
  ]);
  const block: ReplayBlock = {
    blockNumber: 789,
    blockTime: "2026-07-21T00:00:00",
    bookEvents: [
      { user, oid: 8, coin: "BTC", side: "B", px: "99", raw_book_diff: "remove" },
      { user, oid: 8, coin: "BTC", side: "B", px: "100", raw_book_diff: { new: { sz: "4" } } },
    ],
    orderEvents: [
      { user, status: "canceled", order: { coin: "BTC", side: "B", limitPx: "99", sz: "5", oid: 8 } },
      { user, status: "open", order: { coin: "BTC", side: "B", limitPx: "100", sz: "4", oid: 8 } },
    ],
  };
  const after = before.clone();
  applyBlockForward(after, block, "BTC");
  assert.deepEqual(after.toL2(), { bids: [{ px: "100", sz: "4", n: 1 }], asks: [] });
  applyBlockReverse(after, block, "BTC");
  assert.equal(after.fingerprint(), before.fingerprint());
});
