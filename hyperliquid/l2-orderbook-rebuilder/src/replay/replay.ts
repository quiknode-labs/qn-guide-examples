import type {
  BookEvent,
  OrderStatusEvent,
  ReplayBlock,
} from "../data/types.js";
import { isNewDiff, isUpdateDiff } from "../data/types.js";
import { parseDecimal } from "./decimal.js";
import { OrderBook, type RestingOrder } from "./order-book.js";

function assertIdentity(order: RestingOrder, event: BookEvent): void {
  if (
    order.coin !== event.coin ||
    order.side !== event.side ||
    order.px !== parseDecimal(event.px) ||
    order.user !== event.user.toLowerCase()
  ) {
    throw new Error(`Identity mismatch for oid ${String(event.oid)}`);
  }
}

function orderFromEvent(event: BookEvent, size: string): RestingOrder {
  return {
    oid: String(event.oid),
    user: event.user.toLowerCase(),
    coin: event.coin,
    side: event.side,
    px: parseDecimal(event.px),
    sz: parseDecimal(size),
  };
}

function statusSizeForRemoval(
  event: BookEvent,
  statuses: OrderStatusEvent[],
): string {
  const candidates = statuses.filter(
    (status) =>
      String(status.order.oid) === String(event.oid) &&
      status.order.coin === event.coin &&
      status.order.side === event.side &&
      parseDecimal(status.order.limitPx) === parseDecimal(event.px) &&
      status.user.toLowerCase() === event.user.toLowerCase() &&
      parseDecimal(status.order.sz) > 0n,
  );
  const sizes = [...new Set(candidates.map((status) => status.order.sz))];
  if (sizes.length !== 1) {
    throw new Error(
      `Cannot uniquely recover removed size for oid ${String(event.oid)}; found ${sizes.length} candidates`,
    );
  }
  return sizes[0]!;
}

function precedingSizeInBlock(
  events: BookEvent[],
  removeIndex: number,
  oid: string,
): string | undefined {
  for (let index = removeIndex - 1; index >= 0; index -= 1) {
    const previous = events[index]!;
    if (String(previous.oid) !== oid) continue;
    if (isNewDiff(previous.raw_book_diff)) return previous.raw_book_diff.new.sz;
    if (isUpdateDiff(previous.raw_book_diff)) {
      return previous.raw_book_diff.update.newSz;
    }
    return undefined;
  }
  return undefined;
}

export function applyBlockForward(
  book: OrderBook,
  block: ReplayBlock,
  coin: string,
): void {
  for (const event of block.bookEvents) {
    if (event.coin !== coin) continue;
    const diff = event.raw_book_diff;
    if (isNewDiff(diff)) {
      book.add(orderFromEvent(event, diff.new.sz));
      continue;
    }

    const existing = book.get(event.oid);
    if (!existing) {
      throw new Error(
        `Block ${block.blockNumber}: unknown oid ${String(event.oid)}`,
      );
    }
    assertIdentity(existing, event);
    if (isUpdateDiff(diff)) {
      const expected = parseDecimal(diff.update.origSz);
      if (existing.sz !== expected) {
        throw new Error(
          `Block ${block.blockNumber}: update origSz mismatch for oid ${String(event.oid)}`,
        );
      }
      book.setSize(event.oid, parseDecimal(diff.update.newSz));
    } else {
      book.remove(event.oid);
    }
  }
}

export function applyBlockReverse(
  book: OrderBook,
  block: ReplayBlock,
  coin: string,
): void {
  for (let index = block.bookEvents.length - 1; index >= 0; index -= 1) {
    const event = block.bookEvents[index]!;
    if (event.coin !== coin) continue;
    const diff = event.raw_book_diff;

    if (isNewDiff(diff)) {
      const existing = book.get(event.oid);
      if (!existing) {
        throw new Error(
          `Block ${block.blockNumber}: cannot reverse missing new oid ${String(event.oid)}`,
        );
      }
      assertIdentity(existing, event);
      if (existing.sz !== parseDecimal(diff.new.sz)) {
        throw new Error(
          `Block ${block.blockNumber}: new size mismatch for oid ${String(event.oid)}`,
        );
      }
      book.remove(event.oid);
      continue;
    }

    if (isUpdateDiff(diff)) {
      const existing = book.get(event.oid);
      if (existing) {
        assertIdentity(existing, event);
        if (existing.sz !== parseDecimal(diff.update.newSz)) {
          throw new Error(
            `Block ${block.blockNumber}: reverse update newSz mismatch for oid ${String(event.oid)}`,
          );
        }
        book.setSize(event.oid, parseDecimal(diff.update.origSz));
      } else if (parseDecimal(diff.update.newSz) === 0n) {
        book.add(orderFromEvent(event, diff.update.origSz));
      } else {
        throw new Error(
          `Block ${block.blockNumber}: cannot reverse update for missing oid ${String(event.oid)}`,
        );
      }
      continue;
    }

    if (book.get(event.oid)) {
      throw new Error(
        `Block ${block.blockNumber}: oid ${String(event.oid)} already exists while reversing remove`,
      );
    }
    const precedingSize = precedingSizeInBlock(
      block.bookEvents,
      index,
      String(event.oid),
    );
    const size =
      precedingSize ?? statusSizeForRemoval(event, block.orderEvents);
    if (parseDecimal(size) > 0n) book.add(orderFromEvent(event, size));
  }
}
