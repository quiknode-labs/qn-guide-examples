// L4 gRPC stream worker (separate thread)

const { parentPort, workerData } = require("worker_threads");
const { GRPCStream } = require("@quicknode/hyperliquid-sdk");

// Override _connect to add flow_control_window (16MB) for BTC L4 snapshots
var _origConnect = GRPCStream.prototype._connect;
GRPCStream.prototype._connect = async function () {
  var grpc = require("@grpc/grpc-js");
  var protoLoader = require("@grpc/proto-loader");
  var path = require("path");
  var fs = require("fs");

  this._setState("connecting");
  var target = this._getTarget();

  var sdkDist = path.dirname(require.resolve("@quicknode/hyperliquid-sdk"));
  var streamingProto = path.resolve(sdkDist, "proto", "streaming.proto");
  var orderbookProto = path.resolve(sdkDist, "proto", "orderbook.proto");

  if (!fs.existsSync(streamingProto)) throw new Error("Proto not found: " + streamingProto);
  if (!fs.existsSync(orderbookProto)) throw new Error("Proto not found: " + orderbookProto);

  var packageDefinition = protoLoader.loadSync([streamingProto, orderbookProto], {
    keepCase: true, longs: String, enums: Number, defaults: true, oneofs: true,
  });
  var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  var hyperliquid = protoDescriptor.hyperliquid;

  var channelOptions = {
    "grpc.keepalive_time_ms": GRPCStream.KEEPALIVE_TIME_MS,
    "grpc.keepalive_timeout_ms": GRPCStream.KEEPALIVE_TIMEOUT_MS,
    "grpc.keepalive_permit_without_calls": 1,
    "grpc.max_receive_message_length": GRPCStream.MAX_MSG_SIZE,
    "grpc.max_send_message_length": GRPCStream.MAX_MSG_SIZE,
    "grpc-node.flow_control_window": 16 * 1024 * 1024,
  };

  var credentials;
  if (this._secure) {
    credentials = grpc.credentials.createSsl();
  } else {
    credentials = grpc.credentials.createInsecure();
  }

  this._streamingClient = new hyperliquid.Streaming(target, credentials, channelOptions);
  this._blockClient = new hyperliquid.BlockStreaming(target, credentials, channelOptions);
  this._orderbookClient = new hyperliquid.OrderBookStreaming(target, credentials, channelOptions);

  this._setState("connected");
  this._reconnectAttempt = 0;
  this._reconnectDelay = GRPCStream.INITIAL_RECONNECT_DELAY;
  if (this._onConnect) {
    try { this._onConnect(); } catch {}
  }
};

const { endpoint, coin } = workerData;

parentPort.postMessage({ type: "log", text: "[L4 Worker] Starting SDK stream for " + coin });

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
    parentPort.postMessage({ type: "log", text: "[L4 Worker] Connected" });
  },
  onReconnect: function (attempt) {
    parentPort.postMessage({ type: "reconnecting", attempt: attempt });
  },
});

grpc.l4Book(coin, function (data) {
  if (data.type === "snapshot") {
    var bids = data.bids || [];
    var asks = data.asks || [];
    parentPort.postMessage({
      type: "l4snapshot",
      data: {
        coin: data.coin,
        height: String(data.height),
        bidCount: bids.length,
        askCount: asks.length,
        topBid: bids[0] ? bids[0].limit_px : null,
        topAsk: asks[0] ? asks[0].limit_px : null,
      },
    });
  } else if (data.type === "diff") {
    parentPort.postMessage({
      type: "l4diff",
      data: {
        diffData: JSON.stringify(data.data),
        height: String(data.height),
        time: Number(data.time),
      },
    });
  }
});

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
