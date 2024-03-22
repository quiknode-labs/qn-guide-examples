import { ExtendedResult } from "./interfaces";

// Function to generate a report based on a Bitcoin address and a date range
export function generateReportForAddress(
  extendedData: ExtendedResult
): [string, string] {
  const formattedStartDate = extendedData.startDate.toFormat("yyyy-LLLL-dd");
  const formattedEndDate = extendedData.endDate.toFormat("yyyy-LLLL-dd");
  // Logging the report generation process
  console.log(
    `Generating transaction report for Bitcoin address (${extendedData.address}) from ${formattedStartDate} to ${formattedEndDate}`
  );

  // Preparing the CSV header
  let reportLines: string[] = [
    "Day;Timestamp;Timezone;Tx;Type;Direction;From;To;Amount [BTC];Amount [USD];Fees [BTC];Fees [USD];Pre Balance;Post Balance",
  ];

  // Data rows
  for (const item of extendedData.extendedTransactions) {
    // Add the transaction details to the report
    reportLines.push(
      `${item.day};${item.timestamp};${item.userTimezone};${item.txid};${
        item.type
      };${item.direction};${item.fromAddresses};${
        item.toAddresses
      };${item.btcAmount.toFixed(8)};${item.usdAmount.toFixed(
        2
      )};${item.btcFees.toFixed(8)};${item.usdFees.toFixed(
        2
      )};${item.balanceBeforeTx.toFixed(8)};${item.balanceAfterTx.toFixed(8)}`
    );
  }

  const fileName = `transaction_report_${extendedData.address}_${formattedStartDate}_${formattedEndDate}.csv`;

  // Join all lines to form the CSV content
  return [reportLines.join("\n"), fileName];
}
