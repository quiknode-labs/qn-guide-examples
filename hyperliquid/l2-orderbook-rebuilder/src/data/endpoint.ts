const SERVICE_PATHS = new Set(["evm", "info", "hypercore", "exchange"]);

export interface HypercoreEndpoint {
  httpBaseUrl: string;
  hypercoreUrl: string;
  grpcEndpoint: string;
  token: string;
}

export function parseHypercoreEndpoint(providerUrl: string): HypercoreEndpoint {
  let url: URL;
  try {
    url = new URL(providerUrl);
  } catch {
    throw new Error("Quicknode endpoint must be a valid HTTPS URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("Quicknode endpoint must use HTTPS");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length > 0 && SERVICE_PATHS.has(parts.at(-1)!.toLowerCase())) {
    parts.pop();
  }
  if (parts.length !== 1) {
    throw new Error(
      "Expected a Quicknode provider URL shaped like https://host/token[/service]",
    );
  }

  const token = parts[0]!;
  const httpBaseUrl = `https://${url.host}/${token}`;
  return {
    httpBaseUrl,
    hypercoreUrl: `${httpBaseUrl}/hypercore`,
    grpcEndpoint: `${url.hostname}:10000`,
    token,
  };
}

export function endpointFromEnvironment(): HypercoreEndpoint {
  const value =
    process.env.QUICKNODE_HYPERCORE_URL ??
    process.env.QUICKNODE_ENDPOINT_URL;
  if (!value) {
    throw new Error(
      "Set QUICKNODE_ENDPOINT_URL (or QUICKNODE_HYPERCORE_URL) to your authenticated Hyperliquid provider URL",
    );
  }
  return parseHypercoreEndpoint(value);
}

