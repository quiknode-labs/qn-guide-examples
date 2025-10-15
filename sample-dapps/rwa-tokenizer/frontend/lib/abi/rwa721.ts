export const RWA721_ABI = [
  // Constructor
  {
    type: 'constructor',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'symbol', type: 'string', internalType: 'string' },
      { name: 'lzEndpoint', type: 'address', internalType: 'address' },
      { name: 'delegate', type: 'address', internalType: 'address' },
      { name: 'originChainId', type: 'uint32', internalType: 'uint32' },
    ],
    stateMutability: 'nonpayable',
  },
  // Mint function
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'uri', type: 'string', internalType: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  // Standard ERC721 functions
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getApproved',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  // LayerZero V2 Bridge Functions
  {
    type: 'function',
    name: 'send',
    inputs: [
      {
        name: '_sendParam',
        type: 'tuple',
        internalType: 'struct SendParam',
        components: [
          { name: 'dstEid', type: 'uint32', internalType: 'uint32' },
          { name: 'to', type: 'bytes32', internalType: 'bytes32' },
          { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
          { name: 'extraOptions', type: 'bytes', internalType: 'bytes' },
          { name: 'composeMsg', type: 'bytes', internalType: 'bytes' },
          { name: 'oftCmd', type: 'bytes', internalType: 'bytes' },
        ],
      },
      {
        name: '_fee',
        type: 'tuple',
        internalType: 'struct MessagingFee',
        components: [
          { name: 'nativeFee', type: 'uint256', internalType: 'uint256' },
          { name: 'lzTokenFee', type: 'uint256', internalType: 'uint256' },
        ],
      },
      { name: '_refundAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [
      {
        name: 'msgReceipt',
        type: 'tuple',
        internalType: 'struct MessagingReceipt',
        components: [
          { name: 'guid', type: 'bytes32', internalType: 'bytes32' },
          { name: 'nonce', type: 'uint64', internalType: 'uint64' },
          {
            name: 'fee',
            type: 'tuple',
            internalType: 'struct MessagingFee',
            components: [
              { name: 'nativeFee', type: 'uint256', internalType: 'uint256' },
              { name: 'lzTokenFee', type: 'uint256', internalType: 'uint256' },
            ],
          },
        ],
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'quoteSend',
    inputs: [
      {
        name: '_sendParam',
        type: 'tuple',
        internalType: 'struct SendParam',
        components: [
          { name: 'dstEid', type: 'uint32', internalType: 'uint32' },
          { name: 'to', type: 'bytes32', internalType: 'bytes32' },
          { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
          { name: 'extraOptions', type: 'bytes', internalType: 'bytes' },
          { name: 'composeMsg', type: 'bytes', internalType: 'bytes' },
          { name: 'oftCmd', type: 'bytes', internalType: 'bytes' },
        ],
      },
      { name: '_payInLzToken', type: 'bool', internalType: 'bool' },
    ],
    outputs: [
      {
        name: 'msgFee',
        type: 'tuple',
        internalType: 'struct MessagingFee',
        components: [
          { name: 'nativeFee', type: 'uint256', internalType: 'uint256' },
          { name: 'lzTokenFee', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  // Bridge Info
  {
    type: 'function',
    name: 'bridgeInfo',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'originChainId', type: 'uint32', internalType: 'uint32' },
      { name: 'isBridged', type: 'bool', internalType: 'bool' },
      { name: 'bridgeCount', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  // Events
  {
    type: 'event',
    name: 'Minted',
    inputs: [
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'tokenId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'uri', type: 'string', indexed: false, internalType: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true, internalType: 'address' },
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'tokenId', type: 'uint256', indexed: true, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ONFTSent',
    inputs: [
      { name: 'guid', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'dstEid', type: 'uint32', indexed: true, internalType: 'uint32' },
      { name: 'from', type: 'address', indexed: true, internalType: 'address' },
      { name: 'tokenId', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ONFTReceived',
    inputs: [
      { name: 'guid', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'srcEid', type: 'uint32', indexed: true, internalType: 'uint32' },
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'tokenId', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const
