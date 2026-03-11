import { DiffType, type L4DiffEvent } from "@/types/orderflow";
import { normalizeSide } from "@/lib/utils";

let eventCounter = 0;

function extractStatus(status: unknown): string | null {
  if (typeof status === "string") return status.toLowerCase();
  if (typeof status === "object" && status !== null) {
    // Hyperliquid sometimes sends status as { "filled": { ... } } or { "canceled": { ... } }
    const keys = Object.keys(status);
    if (keys.length > 0) return keys[0].toLowerCase();
  }
  return null;
}

export function parseL4Diffs(
  jsonStr: string,
  blockHeight: string,
  timestamp: number
): L4DiffEvent[] {
  let data: any;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return [];
  }

  const events: L4DiffEvent[] = [];

  // Parse order_statuses
  if (Array.isArray(data.order_statuses)) {
    for (const os of data.order_statuses) {
      if (!os || !os.order) continue;
      const status = extractStatus(os.status);
      if (status === "filled" || status === "canceled") {
        events.push({
          id: `l4-${++eventCounter}`,
          type: status === "filled" ? DiffType.FILLED : DiffType.CANCELED,
          oid: os.oid ?? 0,
          user: os.order.user || "",
          side: normalizeSide(os.order.side),
          coin: os.order.coin || "",
          px: os.order.limitPx || "0",
          sz: os.order.sz || os.order.origSz || "0",
          tif: os.order.tif,
          timestamp,
          blockHeight,
        });
      }
    }
  }

  // Parse book_diffs
  if (Array.isArray(data.book_diffs)) {
    for (const bd of data.book_diffs) {
      if (!bd) continue;
      const diff = bd.raw_book_diff;
      let type: DiffType;
      let origSz: string | undefined;
      let newSz: string | undefined;

      let sz: string = "0";

      if (diff === "remove") {
        type = DiffType.REMOVED;
        sz = bd.sz || "0";
      } else if (diff && typeof diff === "object" && "new" in diff) {
        type = DiffType.NEW;
        // Size for NEW orders is inside diff.new.sz
        sz = diff.new?.sz || bd.sz || "0";
      } else if (diff && typeof diff === "object" && "update" in diff) {
        type = DiffType.UPDATED;
        origSz = diff.update?.origSz;
        newSz = diff.update?.newSz;
        sz = newSz || bd.sz || "0";
      } else {
        continue;
      }

      events.push({
        id: `l4-${++eventCounter}`,
        type,
        oid: bd.oid ?? 0,
        user: bd.user || "",
        side: normalizeSide(bd.side),
        coin: bd.coin || "",
        px: bd.px || "0",
        sz,
        origSz,
        newSz,
        tif: bd.tif,
        timestamp,
        blockHeight,
      });
    }
  }

  return events;
}
