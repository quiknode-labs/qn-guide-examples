// L2 gRPC stream worker (separate thread)

const { parentPort, workerData } = require("worker_threads");
const { GRPCStream } = require("@quicknode/hyperliquid-sdk");

const { endpoint, coin, levels } = workerData;

parentPort.postMessage({ type: "log", text: "[L2 Worker] Starting SDK stream for " + coin });

const grpc = new GRPCStream(endpoint, {
  reconnect: true,
  onError: function (err) {
    if (err.code === 1) return;
    parentPort.postMessage({
      type: "error",
      code: err.code || 0,
      message: err.message || String(err),
    });
  },
  onConnect: function () {
    parentPort.postMessage({ type: "log", text: "[L2 Worker] Connected" });
  },
  onReconnect: function (attempt) {
    parentPort.postMessage({ type: "reconnecting", attempt: attempt });
  },
});

grpc.l2Book(coin, function (update) {
  parentPort.postMessage({
    type: "l2update",
    data: {
      coin: update.coin,
      time: update.time,
      blockNumber: String(update.block_number),
      bids: (update.bids || []).map(function (l) { return { px: l[0], sz: l[1], n: l[2] }; }),
      asks: (update.asks || []).map(function (l) { return { px: l[0], sz: l[1], n: l[2] }; }),
    },
  });
}, { nLevels: levels });

grpc.start().catch(function (err) {
  parentPort.postMessage({
    type: "error",
    code: 0,
    message: "Start failed: " + (err.message || String(err)),
  });
});

parentPort.on("message", function (msg) {
  if (msg === "stop") {
    try { grpc.stop(); } catch (e) {}
    process.exit(0);
  }
});
