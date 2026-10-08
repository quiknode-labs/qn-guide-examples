import assert from "node:assert/strict";
import test from "node:test";

import { parseHypercoreEndpoint } from "../../src/data/endpoint.js";

test("derives HTTP and gRPC connection details without leaking service paths", () => {
  const endpoint = parseHypercoreEndpoint(
    "https://example.hype-mainnet.quiknode.pro/secret-token/evm",
  );
  assert.deepEqual(endpoint, {
    httpBaseUrl: "https://example.hype-mainnet.quiknode.pro/secret-token",
    hypercoreUrl:
      "https://example.hype-mainnet.quiknode.pro/secret-token/hypercore",
    grpcEndpoint: "example.hype-mainnet.quiknode.pro:10000",
    token: "secret-token",
  });
});
