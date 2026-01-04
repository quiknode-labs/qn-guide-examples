// Extract parameters from arguments
const address = args[0];

// Check if Quicknode endpoint secret exists
if (!secrets.QUICKNODE_ENDPOINT) {
  throw new Error(
    "QUICKNODE_ENDPOINT secret is required. Please set it in your secrets configuration."
  );
}

const quicknodeEndpoint = secrets.QUICKNODE_ENDPOINT;

// Validate Ethereum address format (basic check: starts with 0x followed by 40 hex characters)
if (
  !address ||
  typeof address !== "string" ||
  !address.match(/^0x[0-9a-fA-F]{40}$/)
) {
  throw new Error(
    "Invalid Ethereum address format. Address must start with '0x' followed by 40 hex characters."
  );
}

// Prepare request payload
const payload = {
  method: "sc_getAddressAnalysis",
  params: {
    hash: address,
  },
  id: 1,
  jsonrpc: "2.0",
};

// Log the endpoint being used (masked for security)
console.log(
  `Making request to Quicknode endpoint: ${quicknodeEndpoint.substring(
    0,
    15
  )}...`
);

// Execute the API request
const apiResponse = await Functions.makeHttpRequest({
  url: quicknodeEndpoint,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  data: payload,
});

// Check for errors
if (apiResponse.error) {
  console.error("Request failed:", apiResponse.error);
  throw new Error("Request to Quicknode endpoint failed");
}

const { data } = apiResponse;

// Log the complete response for debugging
console.log("Address analysis response:", JSON.stringify(data, null, 2));

// Return the result
if (data.result) {
  return Functions.encodeUint256(data.result.score);
} else if (data.error) {
  throw new Error(
    `Quicknode API error: ${data.error.message || JSON.stringify(data.error)}`
  );
} else {
  throw new Error("Unexpected response format from Quicknode");
}
