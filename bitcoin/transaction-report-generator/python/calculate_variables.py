import datetime
from dateutil import tz
from decimal import Decimal
from typing import List, Optional
from interfaces import ExtendedResult, ExtendedTransaction, Result
from blockbook_methods import bb_gettickers

btc_to_satoshi = Decimal('100000000')

def start_of_day(dt: datetime.date, tzinfo: datetime.tzinfo) -> datetime.datetime:
    return datetime.datetime.combine(dt, datetime.time.min, tzinfo=tzinfo)

def end_of_day(dt: datetime.date, tzinfo: datetime.tzinfo) -> datetime.datetime:
    return datetime.datetime.combine(dt, datetime.time.max, tzinfo=tzinfo)

async def calculate_variables(result: Result, config=None) -> ExtendedResult:

    # Default configuration
    if config is None:
        config = {}

    # Determine the local timezone
    tzinfo = tz.tzlocal()  # Default to the local timezone of the user

    start_date = config.get('start_date', None)
    end_date = config.get('end_date', None)
    user_timezone_str = config.get('user_timezone', "local")

    # Set start and end dates to today if not provided
    if start_date is None:
        start_date = datetime.datetime.now(tzinfo).date()
    if end_date is None:
        end_date = datetime.datetime.now(tzinfo).date()

    if user_timezone_str != "local":
        user_timezone = tz.gettz(user_timezone_str)
    else:
        user_timezone = tz.tzlocal()

    start_of_period = start_of_day(start_date, user_timezone)
    end_of_period = end_of_day(end_date, user_timezone)

    current_balance = Decimal(result.balance) / btc_to_satoshi
    cumulative_diff = Decimal('0')

    extended_transactions: List[ExtendedTransaction] = []

    for transaction in result.transactions:

        block_time_utc = datetime.datetime.fromtimestamp(transaction.blockTime, tz=datetime.timezone.utc)
        # If the user provided a timezone, convert block_time to that timezone
        block_time = block_time_utc.astimezone(user_timezone)

        within_interval = start_of_period <= block_time <= end_of_period

        day = block_time.strftime('%Y-%m-%d')
        timestamp = block_time.isoformat()

        vin_is_sender = any(result.address in vin.addresses for vin in transaction.vin)

        type = "Unconfirmed" if transaction.confirmations == 0 else "Confirmed"
        direction = "Outgoing" if vin_is_sender else "Incoming"

        if vin_is_sender:
            # Determine the "sent-back" transaction by checking if any outputs include the address
            is_sent_back = any(result.address in vout.addresses for vout in transaction.vout)

            # Calculate the total BTC amount involved in inputs from our address
            btc_amount_in = sum(Decimal(vin.value) for vin in transaction.vin if result.address in vin.addresses)

            if is_sent_back:
                # Calculate the total BTC amount sent back to our address
                btc_amount_out = sum(
                    Decimal(vout.value) for vout in transaction.vout if result.address in vout.addresses)
                # The net BTC amount is the difference between inputs and outputs to the same address
                btc_amount = (btc_amount_in - btc_amount_out) / btc_to_satoshi
            else:
                # If no BTC was sent back, the BTC amount is just the total inputs
                btc_amount = btc_amount_in / btc_to_satoshi

            # Collect addresses for from and to fields
            from_addresses = result.address
            # Concatenate recipient addresses, excluding transactions sent back to our address
            to_addresses = ', '.join(
                vout.addresses[0] for vout in transaction.vout if result.address not in vout.addresses)
        else:
            # If the address is the recipient, sum up the BTC amounts from all outputs to our address
            btc_amount = sum(
                Decimal(vout.value) for vout in transaction.vout if result.address in vout.addresses) / btc_to_satoshi

            # Concatenate sender addresses
            from_addresses = ', '.join(vin.addresses[0] for vin in transaction.vin if vin.addresses)
            # The recipient address is our address
            to_addresses = result.address

        btc_fees = Decimal(transaction.fees) / btc_to_satoshi if transaction.fees else Decimal('0')

        cumulative_diff = (cumulative_diff - btc_amount) if direction == 'Outgoing' else (cumulative_diff + btc_amount)
        balance_before_tx = current_balance - cumulative_diff
        balance_after_tx = (balance_before_tx - btc_amount) if direction == 'Outgoing' else (balance_before_tx + btc_amount)

        usd_amount = Decimal('0')
        usd_fees = Decimal('0')
        
        if within_interval:
            price_data = await bb_gettickers(int(block_time.timestamp()))
            usd_fees = btc_fees * Decimal(price_data.rates["usd"])
            usd_amount = btc_amount * Decimal(price_data.rates["usd"])

        extended_transaction = ExtendedTransaction(
            txid=transaction.txid,
            version=transaction.version,
            vin=transaction.vin,
            vout=transaction.vout,
            blockHash=transaction.blockHash,
            blockHeight=transaction.blockHeight,
            confirmations=transaction.confirmations,
            blockTime=transaction.blockTime,
            size=transaction.size,
            vsize=transaction.vsize,
            value=transaction.value,
            valueIn=transaction.valueIn,
            fees=transaction.fees,
            day=day,
            timestamp=timestamp,
            direction=direction,
            fromAddresses=from_addresses,
            toAddresses=to_addresses,
            btcAmount=float(btc_amount),
            usdAmount=float(usd_amount),
            btcFees=float(btc_fees),
            usdFees=float(usd_fees),
            type=type,
            balanceBeforeTx=float(balance_before_tx),
            balanceAfterTx=float(balance_after_tx),
            withinInterval=within_interval,
            timezone=user_timezone_str
        )

        extended_transactions.append(extended_transaction)

    filtered_transactions = [t for t in extended_transactions if t.withinInterval]

    return ExtendedResult(
        page=result.page,
        totalPages=result.totalPages,
        itemsOnPage=result.itemsOnPage,
        address=result.address,
        balance=result.balance,
        totalReceived=result.totalReceived,
        totalSent=result.totalSent,
        unconfirmedBalance=result.unconfirmedBalance,
        unconfirmedTxs=result.unconfirmedTxs,
        txs=result.txs,
        transactions=result.transactions,
        extendedTransactions=filtered_transactions,
        startDate=start_of_period,
        endDate=end_of_period,
    )