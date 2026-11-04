import { endpointFromEnvironment } from "../data/endpoint.js";
import { isNewDiff, isUpdateDiff } from "../data/types.js";
import { OrderBook } from "../replay/order-book.js";
import { applyBlockForward, applyBlockReverse } from "../replay/replay.js";
import { captureL4CheckpointWindow } from "./l4-grpc.js";

function valueAfter(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

const coin = (valueAfter("--coin") ?? "BTC").toUpperCase();
const blockCount = Number(valueAfter("--blocks") ?? "20");
if (!Number.isSafeInteger(blockCount) || blockCount <= 0 || blockCount > 200) {
  throw new Error("--blocks must be an integer from 1 to 200");
}

console.error(`Capturing ${coin} checkpoint plus ${blockCount} live diff blocks...`);
const { checkpoint, blocks } = await captureL4CheckpointWindow(
  endpointFromEnvironment(),
  coin,
  blockCount,
);
const anchor = OrderBook.fromCheckpoint(checkpoint);
const book = anchor.clone();
for (const block of blocks) {
  applyBlockForward(book, block, coin);
  book.assertUncrossed();
}
const laterOrderCount = book.size;
for (let index = blocks.length - 1; index >= 0; index -= 1) {
  applyBlockReverse(book, blocks[index]!, coin);
  book.assertUncrossed();
}
if (book.fingerprint() !== anchor.fingerprint()) {
  throw new Error("Independent-anchor validation failed");
}

const transitions = { new: 0, update: 0, remove: 0 };
for (const block of blocks) {
  for (const event of block.bookEvents) {
    if (event.coin !== coin) continue;
    if (isNewDiff(event.raw_book_diff)) transitions.new += 1;
    else if (isUpdateDiff(event.raw_book_diff)) transitions.update += 1;
    else transitions.remove += 1;
  }
}

console.log(
  JSON.stringify(
    {
      coin,
      fromCheckpoint: checkpoint.height,
      throughBlock: blocks.at(-1)!.blockNumber,
      blocks: blocks.length,
      anchorOrders: anchor.size,
      laterOrders: laterOrderCount,
      transitions,
      validation:
        "forward from independent earlier checkpoint, then reverse back exactly: passed",
    },
    null,
    2,
  ),
);
