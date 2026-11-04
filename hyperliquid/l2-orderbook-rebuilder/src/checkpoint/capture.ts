import { captureL4Checkpoint } from "./l4-grpc.js";
import { endpointFromEnvironment } from "../data/endpoint.js";

function valueAfter(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

const coin = (valueAfter("--coin") ?? "BTC").toUpperCase();
const checkpoint = await captureL4Checkpoint(endpointFromEnvironment(), coin);

console.log(
  JSON.stringify(
    {
      coin: checkpoint.coin,
      height: checkpoint.height,
      time: checkpoint.time,
      bids: checkpoint.bids.length,
      asks: checkpoint.asks.length,
      bestBid: checkpoint.bids[0]
        ? {
            px: checkpoint.bids[0].limit_px,
            sz: checkpoint.bids[0].sz,
          }
        : null,
      bestAsk: checkpoint.asks[0]
        ? {
            px: checkpoint.asks[0].limit_px,
            sz: checkpoint.asks[0].sz,
          }
        : null,
    },
    null,
    2,
  ),
);
