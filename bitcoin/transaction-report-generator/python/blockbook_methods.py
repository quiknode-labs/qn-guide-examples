import os
import asyncio
import aiohttp
from dotenv import load_dotenv
from typing import Dict, Any, List
from interfaces import Result, PriceData, Transaction, Vin, Vout  # Ensure correct import paths

# Initialize dotenv to use environment variables
load_dotenv()

# Retrieve the Quicknode endpoint URL from environment variables
QUICKNODE_ENDPOINT = os.getenv("QUICKNODE_ENDPOINT")

# Utility function to parse transaction data
def parse_transaction_data(data: Dict[str, Any]) -> Transaction:
    return Transaction(
        txid=data["txid"],
        version=data["version"],
        vin=[Vin(**vin) for vin in data["vin"]],
        vout=[Vout(**vout) for vout in data["vout"]],
        blockHash=data.get("blockHash", None),
        blockHeight=data["blockHeight"],
        confirmations=data["confirmations"],
        blockTime=data["blockTime"],
        size=data["size"],
        vsize=data["vsize"],
        value=data["value"],
        valueIn=data["valueIn"],
        fees=data["fees"],
        hex=data.get("hex", None)
    )

# Utility function to parse the result data into a Result object
def parse_to_result(data: Dict[str, Any]) -> Result:
    transactions = [parse_transaction_data(tx) for tx in data["transactions"]]
    return Result(
        page=data["page"],
        totalPages=data["totalPages"],
        itemsOnPage=data["itemsOnPage"],
        address=data["address"],
        balance=data["balance"],
        totalReceived=data["totalReceived"],
        totalSent=data["totalSent"],
        unconfirmedBalance=data["unconfirmedBalance"],
        unconfirmedTxs=data["unconfirmedTxs"],
        txs=data["txs"],
        transactions=transactions
    )

# Utility function to parse price data
def parse_to_price_data(data: Dict[str, Any]) -> PriceData:
    return PriceData(ts=data["ts"], rates=data["rates"])

async def bb_getaddress(address: str) -> Result:
    async with aiohttp.ClientSession() as session:
        post_data = {
            "method": "bb_getaddress",
            "params": [
                address,
                {"page": "1", "size": "1000", "fromHeight": "0", "details": "txs"},
            ],
            "id": 1,
            "jsonrpc": "2.0",
        }
        async with session.post(QUICKNODE_ENDPOINT, json=post_data, headers={"Content-Type": "application/json"}) as response:
            if response.status == 200:
                data = await response.json()
                result_data = data['result']
                return parse_to_result(result_data)
            else:
                raise Exception("Failed to fetch transactions")

async def bb_gettickers(timestamp: int) -> PriceData:
    async with aiohttp.ClientSession() as session:
        post_data = {
            "method": "bb_gettickers",
            "params": [{"timestamp": timestamp}],
            "id": 1,
            "jsonrpc": "2.0",
        }
        async with session.post(QUICKNODE_ENDPOINT, json=post_data, headers={"Content-Type": "application/json"}) as response:
            if response.status == 200:
                data = await response.json()
                price_data = data['result']
                return parse_to_price_data(price_data)
            else:
                raise Exception("Failed to fetch tickers")

