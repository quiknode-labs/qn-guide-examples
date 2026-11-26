import type { BookEvent, ReplayBlock } from "../data/types.js";
import { isNewDiff, isUpdateDiff } from "../data/types.js";
import { parseDecimal } from "../replay/decimal.js";

export interface EventProfile {
  blocks: number;
  bookEvents: { new: number; update: number; remove: number };
  orderStatuses: Record<string, number>;
  multiEventSequences: Record<string, number>;
  fullFillUpdateThenRemove: number;
  sameBlockNewThenRemove: number;
  removeThenNew: number;
  priceChangingRemoveThenNew: number;
  triggerOrderStatusEvents: number;
  triggeredStatusEvents: number;
  triggeredWithNewBookDiff: number;
  triggeredWithoutNewBookDiff: number;
  triggeredBlocks: number[];
  triggeredDetails: Array<{
    blockNumber: number;
    coin: string;
    tif: string | null;
    size: string;
    orderType: string | null;
    hasNewBookDiff: boolean;
  }>;
  standaloneRemovals: {
    total: number;
    uniquelyRecoverable: number;
    unresolved: number;
    ambiguous: number;
    statuses: Record<string, number>;
  };
}

function kind(event: BookEvent): "new" | "update" | "remove" {
  if (isNewDiff(event.raw_book_diff)) return "new";
  if (isUpdateDiff(event.raw_book_diff)) return "update";
  return "remove";
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

export function profileReplayBlocks(blocks: ReplayBlock[]): EventProfile {
  const profile: EventProfile = {
    blocks: blocks.length,
    bookEvents: { new: 0, update: 0, remove: 0 },
    orderStatuses: {},
    multiEventSequences: {},
    fullFillUpdateThenRemove: 0,
    sameBlockNewThenRemove: 0,
    removeThenNew: 0,
    priceChangingRemoveThenNew: 0,
    triggerOrderStatusEvents: 0,
    triggeredStatusEvents: 0,
    triggeredWithNewBookDiff: 0,
    triggeredWithoutNewBookDiff: 0,
    triggeredBlocks: [],
    triggeredDetails: [],
    standaloneRemovals: {
      total: 0,
      uniquelyRecoverable: 0,
      unresolved: 0,
      ambiguous: 0,
      statuses: {},
    },
  };

  for (const block of blocks) {
    const byOid = new Map<string, BookEvent[]>();
    for (const event of block.bookEvents) {
      const eventKind = kind(event);
      profile.bookEvents[eventKind] += 1;
      const oid = String(event.oid);
      const events = byOid.get(oid) ?? [];
      events.push(event);
      byOid.set(oid, events);

      if (eventKind !== "remove") continue;
      const previous = events.at(-2);
      if (previous && (isNewDiff(previous.raw_book_diff) || isUpdateDiff(previous.raw_book_diff))) {
        continue;
      }
      profile.standaloneRemovals.total += 1;
      const candidates = block.orderEvents.filter(
        (status) =>
          String(status.order.oid) === oid &&
          status.order.coin === event.coin &&
          status.order.side === event.side &&
          parseDecimal(status.order.limitPx) === parseDecimal(event.px) &&
          status.user.toLowerCase() === event.user.toLowerCase() &&
          parseDecimal(status.order.sz) > 0n,
      );
      const sizes = new Set(candidates.map((status) => status.order.sz));
      if (sizes.size === 1) profile.standaloneRemovals.uniquelyRecoverable += 1;
      else if (sizes.size === 0) profile.standaloneRemovals.unresolved += 1;
      else profile.standaloneRemovals.ambiguous += 1;
      for (const status of new Set(candidates.map((candidate) => candidate.status))) {
        increment(profile.standaloneRemovals.statuses, status);
      }
    }

    for (const status of block.orderEvents) {
      increment(profile.orderStatuses, status.status);
      if (status.status === "triggered" || status.order.isTrigger) {
        profile.triggerOrderStatusEvents += 1;
      }
      if (status.status === "triggered") {
        profile.triggeredStatusEvents += 1;
        if (!profile.triggeredBlocks.includes(block.blockNumber)) {
          profile.triggeredBlocks.push(block.blockNumber);
        }
        const bookEvents = byOid.get(String(status.order.oid)) ?? [];
        const hasNewBookDiff = bookEvents.some((event) => isNewDiff(event.raw_book_diff));
        if (hasNewBookDiff) {
          profile.triggeredWithNewBookDiff += 1;
        } else {
          profile.triggeredWithoutNewBookDiff += 1;
        }
        profile.triggeredDetails.push({
          blockNumber: block.blockNumber,
          coin: status.order.coin,
          tif: status.order.tif ?? null,
          size: status.order.sz,
          orderType: status.order.orderType ?? null,
          hasNewBookDiff,
        });
      }
    }

    for (const events of byOid.values()) {
      if (events.length < 2) continue;
      const kinds = events.map(kind);
      increment(profile.multiEventSequences, kinds.join("->"));
      for (let index = 0; index < events.length - 1; index += 1) {
        const current = events[index]!;
        const next = events[index + 1]!;
        if (
          isUpdateDiff(current.raw_book_diff) &&
          parseDecimal(current.raw_book_diff.update.newSz) === 0n &&
          kind(next) === "remove"
        ) {
          profile.fullFillUpdateThenRemove += 1;
        }
        if (isNewDiff(current.raw_book_diff) && kind(next) === "remove") {
          profile.sameBlockNewThenRemove += 1;
        }
        if (kind(current) === "remove" && isNewDiff(next.raw_book_diff)) {
          profile.removeThenNew += 1;
          if (current.px !== next.px) profile.priceChangingRemoveThenNew += 1;
        }
      }
    }
  }

  profile.orderStatuses = Object.fromEntries(
    Object.entries(profile.orderStatuses).sort(([a], [b]) => a.localeCompare(b)),
  );
  profile.multiEventSequences = Object.fromEntries(
    Object.entries(profile.multiEventSequences).sort(([a], [b]) => a.localeCompare(b)),
  );
  profile.standaloneRemovals.statuses = Object.fromEntries(
    Object.entries(profile.standaloneRemovals.statuses).sort(([a], [b]) => a.localeCompare(b)),
  );
  return profile;
}
