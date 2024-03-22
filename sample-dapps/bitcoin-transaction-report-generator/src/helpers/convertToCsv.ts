import { ExtendedTransaction } from "../interfaces.ts";

const convertToCSV = (data: ExtendedTransaction[]) => {
  const csvRows = [];
  // Headers
  csvRows.push(
    [
      "Day",
      "Time",
      "Transaction ID",
      "Type",
      "Direction",
      "From Addresses",
      "To Addresses",
      "Amount [BTC]",
      "Amount [USD]",
      "Fees [BTC]",
      "Fees [USD]",
      "Pre Balance (BTC)",
      "Post Balance (BTC)",
    ].join(",")
  );

  // Rows
  data.forEach((tx) => {
    const row = []; // Create an empty array for this row
    row.push(tx.day);
    row.push(
      new Date(tx.timestamp).toLocaleTimeString("en-US", {
        timeZone: tx.userTimezone,
        timeZoneName: "short",
      })
    );
    row.push(tx.txid);
    row.push(tx.type);
    row.push(tx.direction);
    row.push(`"${tx.fromAddresses}"`); // Wrap in quotes to handle commas in addresses
    row.push(`"${tx.toAddresses}"`);
    row.push(tx.btcAmount.toFixed(8));
    row.push(tx.usdAmount.toFixed(2));
    row.push(tx.btcFees.toFixed(8));
    row.push(tx.usdFees.toFixed(2));
    row.push(tx.balanceBeforeTx.toFixed(8));
    row.push(tx.balanceAfterTx.toFixed(8));
    csvRows.push(row.join(",")); // Join each row's columns and push
  });

  return csvRows.join("\n"); // Join all rows
};

export const copyAsCSV = (data: ExtendedTransaction[]) => {
  const csvData = convertToCSV(data);
  navigator.clipboard.writeText(csvData).then(
    () => console.log("CSV copied to clipboard"),
    (err) => console.error("Failed to copy CSV: ", err)
  );
};

export const exportAsCSV = (
  data: ExtendedTransaction[],
  filename = "bitcoin-report.csv"
) => {
  const csvData = convertToCSV(data);
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

  // Create a link to download the blob
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.visibility = "hidden";

  // Append to the document and trigger the download
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
};
