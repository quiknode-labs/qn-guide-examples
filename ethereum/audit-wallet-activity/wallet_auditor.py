from web3 import Web3 # we will be using Web3py library for this guide
import json # we will need this to parse through your blockchain node responses
from tqdm import tqdm # this library helps us track the progress of our script

# Configuring Ethereum endpoint
w3 = Web3(Web3.HTTPProvider("https://{your-endpoint-name}.quiknode.pro/{your-token}/"))

# Main function to fetch wallet activity across a range of blocks
def get_transactions_for_addresses(addresses, from_block, to_block):
    transactions = []

    # Calculate the total number of blocks to process
    total_blocks = to_block - from_block + 1

    with tqdm(total=total_blocks, desc="Processing Blocks") as pbar:
        for block_num in range(from_block, to_block + 1):
            # Request block data
            block = w3.eth.getBlock(block_num, full_transactions=True)

            # Identify block transactions where address of interest is found
            for tx in block.transactions:
                if tx["from"] in addresses or tx["to"] in addresses:
                    tx_details = {
                        "block": block_num,
                        "hash": tx.hash.hex(),
                        "from": tx["from"],
                        "to": tx["to"],
                        "value": tx["value"],
                        "gas": tx["gas"],
                        "gasPrice": tx["gasPrice"],
                        "input": tx["input"],
                        "token_transfers": [],
                        "internal_transactions": []
                    }

                    # Fetch token transfers
                    tx_details["token_transfers"].extend(get_token_transfers(tx["from"], block_num))
                    tx_details["token_transfers"].extend(get_token_transfers(tx["to"], block_num))

                    # Check for interactions with contracts and get internal transactions
                    if tx["to"] and w3.eth.getCode(tx["to"]).hex() != "0x":
                        tx_details["internal_transactions"].extend(get_internal_transactions(tx.hash.hex()))

                    transactions.append(tx_details)

            # Update the progress bar
            pbar.update(1)
                
    return transactions

# Function to fetch wallet token transfers 
def get_token_transfers(address, block_num):
    # Convert the address to its 32 bytes representation
    padded_address = address.lower().replace("0x", "0x" + "0" * 24)

    # Convert block_num to hexadecimal string
    block_hex = hex(block_num)

    filter_params = {
        "fromBlock": block_hex,
        "toBlock": block_hex,
        "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",  # ERC20 Transfer event signature
            None,
            None
        ]
    }

    # Look for the address as the sender
    filter_params["topics"][1] = padded_address
    sent_transfers = w3.eth.get_logs(filter_params)
    
    # Parse through API response and record transfer details
    sent_transfers_list = []
    for entry in sent_transfers:
        modified_entry = {
            "contractAddress": entry["address"],
            "from": w3.toChecksumAddress(entry["topics"][1].hex().lstrip("0x")),
            "to": w3.toChecksumAddress(entry["topics"][2].hex().lstrip("0x")),
            "value": int(entry["data"],16),
            "topics": [topic.hex() if isinstance(topic, bytes) else topic for topic in entry["topics"]],
            "data": entry["data"],
            "blockNumber": entry["blockNumber"],
            "logIndex": entry["logIndex"],
            "transactionIndex": entry["transactionIndex"],
            "transactionHash": entry["transactionHash"].hex(),
            "blockHash": entry["blockHash"].hex(),
            "removed": entry["removed"]
        }
        sent_transfers_list.append(modified_entry)

    # Look for the address as the receiver
    filter_params["topics"][1] = None
    filter_params["topics"][2] = padded_address
    received_transfers = w3.eth.getLogs(filter_params)

    # Parse through API response and record transfer details
    received_transfers_list = []
    for entry in received_transfers:
        modified_entry = {
            "contractAddress": entry["address"],
            "from": w3.toChecksumAddress(entry["topics"][1].hex().lstrip("0x")),
            "to": w3.toChecksumAddress(entry["topics"][2].hex().lstrip("0x")),
            "value": int(entry["data"],16),
            "topics": [topic.hex() if isinstance(topic, bytes) else topic for topic in entry["topics"]],
            "data": entry["data"],
            "blockNumber": entry["blockNumber"],
            "logIndex": entry["logIndex"],
            "transactionIndex": entry["transactionIndex"],
            "transactionHash": entry["transactionHash"].hex(),
            "blockHash": entry["blockHash"].hex(),
            "removed": entry["removed"]
        }
        received_transfers_list.append(modified_entry)

    return sent_transfers_list + received_transfers_list

# Function to fetch wallet internal transactions
def get_internal_transactions(tx_hash):
    try:
        # Making request 
        trace = w3.provider.make_request("debug_traceTransaction", [tx_hash, {"tracer": "callTracer"}])

        internal_txs = []
        if "result" in trace:
            internal_txs.append(trace["result"]["calls"])
        return internal_txs
    
    except Exception as e:
        return str(e)
    
# Execution function
def run(addresses, from_block, to_block):

    transactions = get_transactions_for_addresses(addresses, from_block, to_block)

    # Write output to the JSON file
    output_file_path = "wallet_audit_data.json"
    with open(output_file_path, "w") as json_file:
        json.dump(transactions, json_file, indent=4)


# Usage example:
run(["0x91b51c173a4bDAa1A60e234fC3f705A16D228740"],17881437, 17881437 )