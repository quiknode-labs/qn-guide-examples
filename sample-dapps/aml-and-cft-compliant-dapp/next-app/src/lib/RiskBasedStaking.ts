const RiskBasedStakingContract = {
  address: "0x4dF694d805BcB0E3d283B4D1F42B6fbcF3F1787D",
  abi: [
    {
      type: "constructor",
      inputs: [{ name: "router", type: "address", internalType: "address" }],
      stateMutability: "nonpayable",
    },
    { type: "receive", stateMutability: "payable" },
    {
      type: "function",
      name: "acceptOwnership",
      inputs: [],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "handleOracleFulfillment",
      inputs: [
        { name: "requestId", type: "bytes32", internalType: "bytes32" },
        { name: "response", type: "bytes", internalType: "bytes" },
        { name: "err", type: "bytes", internalType: "bytes" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "isAllowedToStake",
      inputs: [{ name: "user", type: "address", internalType: "address" }],
      outputs: [{ name: "", type: "bool", internalType: "bool" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "owner",
      inputs: [],
      outputs: [{ name: "", type: "address", internalType: "address" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "pendingRequests",
      inputs: [{ name: "", type: "address", internalType: "address" }],
      outputs: [{ name: "", type: "bool", internalType: "bool" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "requestToUser",
      inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
      outputs: [{ name: "", type: "address", internalType: "address" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "riskScores",
      inputs: [{ name: "", type: "address", internalType: "address" }],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "riskThreshold",
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "s_lastError",
      inputs: [],
      outputs: [{ name: "", type: "bytes", internalType: "bytes" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "s_lastRequestId",
      inputs: [],
      outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "s_lastResponse",
      inputs: [],
      outputs: [{ name: "", type: "bytes", internalType: "bytes" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "sendRequest",
      inputs: [
        { name: "source", type: "string", internalType: "string" },
        {
          name: "encryptedSecretsUrls",
          type: "bytes",
          internalType: "bytes",
        },
        {
          name: "donHostedSecretsSlotID",
          type: "uint8",
          internalType: "uint8",
        },
        {
          name: "donHostedSecretsVersion",
          type: "uint64",
          internalType: "uint64",
        },
        { name: "args", type: "string[]", internalType: "string[]" },
        { name: "bytesArgs", type: "bytes[]", internalType: "bytes[]" },
        {
          name: "subscriptionId",
          type: "uint64",
          internalType: "uint64",
        },
        { name: "gasLimit", type: "uint32", internalType: "uint32" },
        { name: "donID", type: "bytes32", internalType: "bytes32" },
      ],
      outputs: [
        { name: "requestId", type: "bytes32", internalType: "bytes32" },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "sendRequestCBOR",
      inputs: [
        { name: "request", type: "bytes", internalType: "bytes" },
        {
          name: "subscriptionId",
          type: "uint64",
          internalType: "uint64",
        },
        { name: "gasLimit", type: "uint32", internalType: "uint32" },
        { name: "donID", type: "bytes32", internalType: "bytes32" },
      ],
      outputs: [
        { name: "requestId", type: "bytes32", internalType: "bytes32" },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "setRiskThreshold",
      inputs: [
        { name: "newThreshold", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "stake",
      inputs: [],
      outputs: [],
      stateMutability: "payable",
    },
    {
      type: "function",
      name: "stakedBalances",
      inputs: [{ name: "", type: "address", internalType: "address" }],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "totalStaked",
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "transferOwnership",
      inputs: [{ name: "to", type: "address", internalType: "address" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "withdraw",
      inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "event",
      name: "OwnershipTransferRequested",
      inputs: [
        {
          name: "from",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          indexed: true,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "OwnershipTransferred",
      inputs: [
        {
          name: "from",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          indexed: true,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "RequestFulfilled",
      inputs: [
        {
          name: "id",
          type: "bytes32",
          indexed: true,
          internalType: "bytes32",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "RequestSent",
      inputs: [
        {
          name: "id",
          type: "bytes32",
          indexed: true,
          internalType: "bytes32",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "Response",
      inputs: [
        {
          name: "requestId",
          type: "bytes32",
          indexed: true,
          internalType: "bytes32",
        },
        {
          name: "response",
          type: "bytes",
          indexed: false,
          internalType: "bytes",
        },
        {
          name: "err",
          type: "bytes",
          indexed: false,
          internalType: "bytes",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "RiskCheckRequested",
      inputs: [
        {
          name: "user",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "requestId",
          type: "bytes32",
          indexed: false,
          internalType: "bytes32",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "RiskScoreUpdated",
      inputs: [
        {
          name: "user",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "score",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "Staked",
      inputs: [
        {
          name: "user",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "amount",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "Withdrawn",
      inputs: [
        {
          name: "user",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "amount",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    { type: "error", name: "EmptyArgs", inputs: [] },
    { type: "error", name: "EmptySecrets", inputs: [] },
    { type: "error", name: "EmptySource", inputs: [] },
    {
      type: "error",
      name: "InsufficientBalance",
      inputs: [
        { name: "requested", type: "uint256", internalType: "uint256" },
        { name: "available", type: "uint256", internalType: "uint256" },
      ],
    },
    { type: "error", name: "NoInlineSecrets", inputs: [] },
    {
      type: "error",
      name: "NoRiskScore",
      inputs: [{ name: "user", type: "address", internalType: "address" }],
    },
    { type: "error", name: "OnlyRouterCanFulfill", inputs: [] },
    {
      type: "error",
      name: "PendingRiskCheck",
      inputs: [{ name: "user", type: "address", internalType: "address" }],
    },
    {
      type: "error",
      name: "RiskyAddress",
      inputs: [
        { name: "user", type: "address", internalType: "address" },
        { name: "score", type: "uint256", internalType: "uint256" },
      ],
    },
    {
      type: "error",
      name: "UnexpectedRequestID",
      inputs: [{ name: "requestId", type: "bytes32", internalType: "bytes32" }],
    },
  ],
};

export default RiskBasedStakingContract;
