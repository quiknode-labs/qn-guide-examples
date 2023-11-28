// Importing necessary modules and libraries
import { Core, viem } from "@quicknode/sdk"; // Importing Core and viem from the QuickNode SDK
import fs from "fs-extra"; // Importing the file system module for file operations
import * as cli from "cli-progress"; // Importing the CLI progress bar module for visual progress feedback in the console

// Creating a new instance of Core from the QuickNode SDK
const core = new Core({
  endpointUrl: "QUICKNODE_ENDPOINT", // The endpoint URL of your QuickNode. Replace "QUICKNODE_ENDPOINT" with your actual QuickNode endpoint URL.
});

// Function to get ERC20 token transfers for a specific address within a given block
async function getERC20TokenTransfers(address, blockNum) {
  const transfers = []; // Array to store the transfers

  // Convert the block number to hexadecimal format
  const blockHex = viem.toHex(blockNum);

  // Fetch logs of token transfers sent from the given address
  const sentTransfers = await core.client.getLogs({
    fromBlock: blockHex,
    toBlock: blockHex,
    event: viem.parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ),
    args: { from: address },
    strict: true,
  });

  // Parse the events of token transfers sent
  let parsedEvents = parseTransferEvents(sentTransfers);

  // Add the parsed sent transfers to the transfers array
  transfers.push(...parsedEvents);

  // Fetch logs of token transfers received by the given address
  const receivedTransfers = await core.client.getLogs({
    fromBlock: blockHex,
    toBlock: blockHex,
    event: viem.parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ),
    args: { to: address },
    strict: true,
  });
  // Parse the events of token transfers received
  parsedEvents = parseTransferEvents(receivedTransfers);

  // Add the parsed received transfers to the transfers array
  transfers.push(...parsedEvents);

  return transfers; // Return the combined list of sent and received transfers
}

// Function to get ERC721 token transfers for a specific address within a given block
async function getERC721TokenTransfers(address, blockNum) {
  const transfers = []; // Array to store the transfers

  // Convert the block number to hexadecimal format
  const blockHex = viem.toHex(blockNum);

  // Fetch logs of ERC721 token transfers sent from the given address
  const sentTransfers = await core.client.getLogs({
    fromBlock: blockHex,
    toBlock: blockHex,
    event: viem.parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ),
    args: { from: address },
    strict: true,
  });

  // Parse the events of token transfers sent
  let parsedEvents = parseTransferEvents(sentTransfers);

  // Add the parsed sent transfers to the transfers array
  transfers.push(...parsedEvents);

  // Fetch logs of ERC721 token transfers received by the given address
  const receivedTransfers = await core.client.getLogs({
    fromBlock: blockHex,
    toBlock: blockHex,
    event: viem.parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ),
    args: { to: address },
    strict: true,
  });

  // Parse the events of token transfers received
  parsedEvents = parseTransferEvents(receivedTransfers);

  // Add the parsed received transfers to the transfers array
  transfers.push(...parsedEvents);

  return transfers; // Return the combined list of sent and received transfers
}

// Function to get ERC1155 token transfers for a specific address within a given block
async function getERC1155TokenTransfers(address, blockNum) {
  const transfers = []; // Array to store the transfers

  // Convert the block number to hexadecimal format
  const blockHex = viem.toHex(blockNum);

  // Fetch logs of ERC1155 token transfers sent from the given address (for single transfers)
  let sentTransfers = await core.client.getLogs({
    fromBlock: blockHex,
    toBlock: blockHex,
    event: viem.parseAbiItem(
      "event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value)"
    ),
    args: { _from: address },
    strict: true,
  });

  // Parse the events of single token transfers sent
  let parsedEvents = parseTransferEvents(sentTransfers);
  transfers.push(...parsedEvents);

  // Fetch logs of ERC1155 token transfers sent from the given address (for batch transfers)
  sentTransfers = await core.client.getLogs({
    fromBlock: blockHex,
    toBlock: blockHex,
    event: viem.parseAbiItem(
      "event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values)"
    ),
    args: { _from: address },
    strict: true,
  });

  // Parse the events of batch token transfers sent
  parsedEvents = parseTransferEvents(sentTransfers);
  transfers.push(...parsedEvents);

  // Fetch logs of ERC1155 token transfers received by the given address (for single transfers)
  let receivedTransfers = await core.client.getLogs({
    fromBlock: blockHex,
    toBlock: blockHex,
    event: viem.parseAbiItem(
      "event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value)"
    ),
    args: { _to: address },
    strict: true,
  });

  // Parse the events of single token transfers received
  parsedEvents = parseTransferEvents(receivedTransfers);
  transfers.push(...parsedEvents);

  // Fetch logs of ERC1155 token transfers received by the given address (for batch transfers)
  receivedTransfers = await core.client.getLogs({
    fromBlock: blockHex,
    toBlock: blockHex,
    event: viem.parseAbiItem(
      "event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values)"
    ),
    args: { _to: address },
    strict: true,
  });

  // Parse the events of batch token transfers received
  parsedEvents = parseTransferEvents(receivedTransfers);
  transfers.push(...parsedEvents);

  return transfers; // Return the combined list of sent and received transfers
}

// Function to parse transfer event logs into a more readable format
function parseTransferEvents(events) {
  // Mapping each event to a formatted object
  return events.map((event) => ({
    contractAddress: event.address, // The address of the contract that emitted the event
    value: event.data === "0x" ? "0x" : viem.fromHex(event.data, "number"), // The value transferred, converted from hex to number if not zero
    topics: event.topics.map((topic) => topic), // The indexed event parameters
    data: event.data, // The data field of the event log
    args: event.args, // The arguments of the log (decoded parameters)
    blockNumber: event.blockNumber, // The block number in which the event was recorded
    logIndex: event.logIndex, // The index of the log inside the block
    transactionIndex: event.transactionIndex, // The index of the transaction in the block
    transactionHash: event.transactionHash, // The hash of the transaction
    blockHash: event.blockHash, // The hash of the block containing the transaction
    removed: event.removed, // A flag indicating if the log was removed due to a chain reorganization
  }));
}

// Function to get internal transactions for a specific transaction hash
async function getInternalTransactions(txHash) {
  try {
    // Requesting a trace of the transaction using the debug_traceTransaction method
    const traceResponse = await core.client.request({
      method: "debug_traceTransaction",
      params: [txHash, { tracer: "callTracer" }], // Using a call tracer for detailed transaction execution
    });

    const internalTxs = [];

    // Check if the traceResponse object has the 'calls' property
    if (Object.prototype.hasOwnProperty.call(traceResponse, "calls")) {
      const result = traceResponse.calls; // Extracting the call trace from the response

      // Add the call trace results to the internal transactions array
      // The structure of the call trace determines how internal transactions are extracted
      internalTxs.push(...result);
    }

    return internalTxs; // Return the parsed internal transactions
  } catch (error) {
    // Log and handle any errors that occur during the request
    console.error("An error occurred:", error);
    return []; // Return an empty array in case of an error
  }
}

// Function to get transactions for specific addresses within a block range and for given token types
async function getTransactionsForAddresses(
  addresses,
  fromBlock,
  toBlock,
  tokenTypes
) {
  // Initialize a progress bar
  const bar1 = new cli.SingleBar({}, cli.Presets.shades_classic);

  // Start the progress bar
  bar1.start(toBlock - fromBlock, 0);

  const transactions = []; // Array to store the transactions

  // Loop through each block in the specified range
  for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
    // Stop the progress bar if it's the last block, else increment
    blockNum === toBlock ? bar1.stop() : bar1.increment();

    // Fetch the block and its transactions
    const block = await core.client.getBlock({
      blockNumber: blockNum,
      includeTransactions: true,
    });

    // Process each transaction in the block
    for (const tx of block.transactions) {
      // Check if the transaction involves any of the specified addresses
      if (
        (tx.from && addresses.includes(viem.getAddress(tx.from))) ||
        (tx.to && addresses.includes(viem.getAddress(tx.to)))
      ) {
        // Initialize transaction details object
        const txDetails = {
          block: blockNum,
          hash: tx.hash,
          from: viem.getAddress(tx.from),
          to: viem.getAddress(tx.to),
          value: tx.value,
          gas: tx.gas,
          gasPrice: tx.gasPrice,
          input: tx.input,
          internalTransactions: [],
        };

        let typeTransfers = []; // Array to store token transfers

        // Check if the sender address is one of the specified addresses
        const isSender = addresses.includes(viem.getAddress(tx.from));

        // Process each token type
        for (const tokenType of tokenTypes) {
          // Fetch token transfers based on the token type and whether the address is a sender or receiver
          if (isSender) {
            // Handle token transfers based on the specific token type for sender address
            switch (tokenType) {
              case "ERC20":
                typeTransfers = await getERC20TokenTransfers(tx.from, blockNum);
                break;
              case "ERC721":
                typeTransfers = await getERC721TokenTransfers(
                  tx.from,
                  blockNum
                );
                break;
              case "ERC1155":
                typeTransfers = await getERC1155TokenTransfers(
                  tx.from,
                  blockNum
                );
                break;
              default:
                throw new Error("No supported token type.");
            }
          } else {
            // Handle token transfers based on the specific token type for receiver address
            switch (tokenType) {
              case "ERC20":
                typeTransfers = await getERC20TokenTransfers(tx.to, blockNum);
                break;
              case "ERC721":
                typeTransfers = await getERC721TokenTransfers(tx.to, blockNum);
                break;
              case "ERC1155":
                typeTransfers = await getERC1155TokenTransfers(tx.to, blockNum);
                break;
              default:
                throw new Error("No supported token type.");
            }
          }

          // Add the fetched token transfers to the transaction details
          if (typeTransfers.length) {
            // If the token type does not already exist in txDetails, initialize it

            if (!Object.prototype.hasOwnProperty.call(txDetails, tokenType)) {
              txDetails[tokenType] = { tokenTransfers: [] };
            }
            // Add the transfers to the corresponding token type in txDetails
            txDetails[tokenType].tokenTransfers.push(...typeTransfers);
          }
        }

        // Fetch and add internal transactions if applicable
        const bytecode = await core.client.getBytecode({
          address: tx.to,
        });

        if (tx.to && bytecode !== "0x") {
          txDetails.internalTransactions.push(
            ...(await getInternalTransactions(tx.hash))
          );
        }
        // Add the detailed transaction to the transactions array
        transactions.push(txDetails);
      }
    }
  }
  return transactions; // Return the collected transactions
}

// Function to check and validate the input variables: addresses, block numbers, and token types
function checkVariables(addresses, fromBlock, toBlock, tokenTypes) {
  // Iterate through each address and check if it's a valid EVM-compatible address
  addresses.forEach((address) => {
    if (!viem.isAddress(address)) {
      throw new Error(
        `The address (${address}) is not EVM-compatible. Please check the addresses.`
      );
    }
  });

  // Check if 'fromBlock' and 'toBlock' are integers
  if (!Number.isInteger(fromBlock) || !Number.isInteger(toBlock)) {
    throw new Error("Block numbers must be an integer.");
  }

  // Check if 'fromBlock' is not greater than 'toBlock'
  if (fromBlock > toBlock) {
    throw new Error("Last block must be greater than first block.");
  }

  // Define valid token types
  const validTokenTypes = ["ERC20", "ERC721", "ERC1155"];

  // Check if all elements in 'tokenTypes' are valid token types
  if (!tokenTypes.every((tokenType) => validTokenTypes.includes(tokenType))) {
    throw new Error(
      `Invalid token type: ${tokenTypes}. Must be one of ${validTokenTypes.join(
        ", "
      )}.`
    );
  }
}

// Main function to run the transaction fetching process
async function run(addresses, fromBlock, toBlock, tokenTypes) {
  try {
    // Check if the input variables are valid
    checkVariables(addresses, fromBlock, toBlock, tokenTypes);

    // Convert all addresses to checksummed format for EVM compatibility
    const checksummedAddresses = addresses.map((address) =>
      viem.getAddress(address)
    );

    // Fetch transactions for the given addresses, block range, and token types
    const transactions = await getTransactionsForAddresses(
      checksummedAddresses,
      fromBlock,
      toBlock,
      tokenTypes
    );

    // Define a replacer function for JSON.stringify to handle big integers
    const replacer = (key, value) =>
      typeof value === "bigint" ? Number(value) : value;

    // Path for the output file
    const outputFilePath = "wallet_audit_data.json";

    // Convert the transactions object to a JSON string with indentation for readability
    const stringified = JSON.stringify(transactions, replacer, 4);

    // Write the JSON string to the specified file
    fs.writeFileSync(outputFilePath, stringified);

    console.log("Data has been saved to " + outputFilePath);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Usage example
// run(["address1", "address2"], fromBlock, toBlock, ["tokenStandard1", "tokenStandard2"]);

run(["0xe2233D97f30745fa5f15761B81B281BE5959dB5C"], 38063215, 38063220, [
  "ERC20",
  "ERC721",
  "ERC1155",
]);
