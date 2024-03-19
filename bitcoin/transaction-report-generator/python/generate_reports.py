from typing import Tuple
from interfaces import ExtendedResult

def generate_report_for_address(extended_data: ExtendedResult) -> Tuple[str, str]:
    # Logging the report generation process
    print(
        f"Generating transaction report for Bitcoin address ({extended_data.address}) "
        f"from {extended_data.startDate.strftime('%Y-%B-%d')} "
        f"to {extended_data.endDate.strftime('%Y-%B-%d')}"
    )

    # Preparing the CSV header
    report_lines = [
        "Day;Timestamp;Timezone;Tx;Type;Direction;From;To;Amount [BTC];Amount [USD];Fees [BTC];Fees [USD];Pre Balance;Post Balance",
    ]

    # Data rows
    for item in extended_data.extendedTransactions:
        # Add the transaction details to the report
        report_lines.append(
            f"{item.day};{item.timestamp};{item.timezone};{item.txid};{item.type};"
            f"{item.direction};{item.fromAddresses};{item.toAddresses};"
            f"{item.btcAmount:.8f};{item.usdAmount:.2f};"
            f"{item.btcFees:.8f};{item.usdFees:.2f};"
            f"{item.balanceBeforeTx:.8f};{item.balanceAfterTx:.8f}"
        )

    file_name = (
        f"transaction_report_{extended_data.address}_"
        f"{extended_data.startDate.strftime('%Y-%B-%d')}_"
        f"{extended_data.endDate.strftime('%Y-%B-%d')}.csv"
    )

    # Join all lines to form the CSV content
    return "\n".join(report_lines), file_name
