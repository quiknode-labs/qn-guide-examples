from typing import List, Optional

# Represents the structure for the overall result of a blockchain query
class Result:
    def __init__(self, page: int, totalPages: int, itemsOnPage: int, address: str, balance: str,
                 totalReceived: str, totalSent: str, unconfirmedBalance: str, unconfirmedTxs: int,
                 txs: int, transactions: List['Transaction']):
        self.page = page
        self.totalPages = totalPages
        self.itemsOnPage = itemsOnPage
        self.address = address
        self.balance = balance
        self.totalReceived = totalReceived
        self.totalSent = totalSent
        self.unconfirmedBalance = unconfirmedBalance
        self.unconfirmedTxs = unconfirmedTxs
        self.txs = txs
        self.transactions = transactions

# Represents the details of a single Bitcoin transaction
class Transaction:
    def __init__(self, txid: str, version: int, vin: List['Vin'], vout: List['Vout'],
                 blockHeight: int, confirmations: int, blockTime: int, size: int, vsize: int,
                 value: str, valueIn: str, fees: str, hex: Optional[str] = None, blockHash: Optional[str] = None):
        self.txid = txid
        self.version = version
        self.vin = vin
        self.vout = vout
        self.blockHash = blockHash
        self.blockHeight = blockHeight
        self.confirmations = confirmations
        self.blockTime = blockTime
        self.size = size
        self.vsize = vsize
        self.value = value
        self.valueIn = valueIn
        self.fees = fees
        self.hex = hex

class ExtendedTransaction(Transaction):
    def __init__(self, day: str, timestamp: str, direction: str, fromAddresses: str, toAddresses: str,
                 btcAmount: float, usdAmount: float, btcFees: float, usdFees: float, type: str,
                 balanceBeforeTx: float, balanceAfterTx: float, withinInterval: bool, timezone: str, **kwargs):
        super().__init__(**kwargs)
        self.day = day
        self.timestamp = timestamp
        self.direction = direction
        self.fromAddresses = fromAddresses
        self.toAddresses = toAddresses
        self.btcAmount = btcAmount
        self.usdAmount = usdAmount
        self.btcFees = btcFees
        self.usdFees = usdFees
        self.type = type
        self.balanceBeforeTx = balanceBeforeTx
        self.balanceAfterTx = balanceAfterTx
        self.withinInterval = withinInterval
        self.timezone = timezone

class ExtendedResult(Result):
    def __init__(self, extendedTransactions: List[ExtendedTransaction], startDate: str, endDate: str, **kwargs):
        super().__init__(**kwargs)
        self.extendedTransactions = extendedTransactions
        self.startDate = startDate
        self.endDate = endDate

# Represents an input in a Bitcoin transaction
class Vin:
    def __init__(self, txid: str, sequence: int, n: int, addresses: List[str],
                 isAddress: bool, value: str, hex: Optional[str] = None, isOwn: Optional[bool] = None, vout: Optional[int] = None):
        self.txid = txid
        self.vout = vout
        self.sequence = sequence
        self.n = n
        self.addresses = addresses
        self.isAddress = isAddress
        self.value = value
        self.hex = hex
        self.isOwn = isOwn

# Represents an output in a Bitcoin transaction
class Vout:
    def __init__(self, value: str, n: int, hex: str, addresses: List[str], isAddress: bool,
                 spent: Optional[bool] = None, isOwn: Optional[bool] = None):
        self.value = value
        self.n = n
        self.hex = hex
        self.addresses = addresses
        self.isAddress = isAddress
        self.spent = spent
        self.isOwn = isOwn

# Represents price data, including a timestamp and currency rates
class PriceData:
    def __init__(self, ts: int, rates: 'Rates'):
        self.ts = ts
        self.rates = rates

# Contains currency conversion rates, e.g., from Bitcoin to USD
class Rates:
    def __init__(self, usd: float):
        self.usd = usd