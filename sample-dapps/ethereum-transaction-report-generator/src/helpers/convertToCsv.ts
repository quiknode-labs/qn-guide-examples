import { ExtractedTransaction } from "../interfaces.ts";

const convertToCSV = (data: ExtractedTransaction[]) => {
  const csvRows = [];
  // Headers
  csvRows.push(
    [
      "Day",
      "Time",
      "Block",
      "Transaction ID",
      "Transaction Status",
      "Transaction Type",
      "Asset",
      "Sender Address",
      "Direction",
      "Receiver Address",
      "Amount",
      "Token ID",
      "Fees [ETH]",
      "Method Name/ID",
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
    row.push(tx.blockHeight);
    row.push(tx.txid);
    row.push(tx.status);
    row.push(tx.txType);
    row.push(tx.assetType);
    row.push(tx.senderAddress);
    row.push(tx.direction);
    row.push(tx.receiverAddress);
    row.push(tx.value);
    row.push(tx.tokenId ? tx.tokenId : "N/A");
    row.push(tx.fee);
    row.push(
      tx.methodNameOrId.startsWith("0x")
        ? `"${tx.methodNameOrId}"`
        : tx.methodNameOrId
    );
    csvRows.push(row.join(",")); // Join each row's columns and push
  });

  return csvRows.join("\n"); // Join all rows
};

export const copyAsCSV = (data: ExtractedTransaction[]) => {
  const csvData = convertToCSV(data);
  navigator.clipboard.writeText(csvData).then(
    () => console.log("CSV copied to clipboard"),
    (err) => console.error("Failed to copy CSV: ", err)
  );
};

export const exportAsCSV = (
  data: ExtractedTransaction[],
  filename = "ethereum-report.csv"
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
