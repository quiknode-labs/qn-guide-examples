// Import necessary types and libraries
import { DateTime } from "luxon";
import { viem } from "@quicknode/sdk";
import {
  Result,
  ExtractedTransaction,
  ExtendedResult,
  CalculateVariablesOptions,
} from "../interfaces";

export async function calculateVariables(
  result: Result,
  options: CalculateVariablesOptions = {}
): Promise<ExtendedResult> {
  const userTimezone = options.userTimezone || DateTime.local().zoneName;
  const startDate = options.startDate || DateTime.now().setZone(userTimezone);
  const endDate = options.endDate || DateTime.now().setZone(userTimezone);

  const startOfPeriod = startDate.startOf("day");
  const endOfPeriod = endDate.endOf("day");

  const extractedData: ExtractedTransaction[] = [];

  for (const transaction of result.transactions) {
    const blockTime = DateTime.fromMillis(transaction.blockTime * 1000, {
      zone: userTimezone,
    });
    const day = blockTime.toFormat("yyyy-MM-dd");
    const timestamp: string = blockTime.toString() || "";

    const status = transaction.confirmations > 0 ? "Confirmed" : "Pending";

    let methodNameOrId = "";
    if (transaction.ethereumSpecific?.parsedData) {
      const { name, methodId } = transaction.ethereumSpecific.parsedData;
      if (name && methodId) {
        methodNameOrId = `${name} (${methodId})`;
      } else {
        methodNameOrId = name || methodId || "Unknown";
      }
    }

    if (blockTime < startOfPeriod || blockTime > endOfPeriod) continue;

    // Handle normal ETH transactions
    for (const vin of transaction.vin) {
      if (vin.addresses && vin.addresses.includes(result.address)) {
        for (const vout of transaction.vout) {
          if (vout.value === "0") continue;
          extractedData.push({
            txid: transaction.txid,
            blockHeight: transaction.blockHeight,
            direction: "Outgoing",
            txType: "Normal",
            assetType: "ETH",
            senderAddress: result.address,
            receiverAddress: vout.addresses.join(", "),
            value: viem.formatEther(BigInt(vout.value)),
            fee: viem.formatEther(BigInt(transaction.fees)),
            day,
            timestamp,
            userTimezone,
            status,
            methodNameOrId,
          });
        }
      }
    }

    for (const vout of transaction.vout) {
      if (vout.addresses && vout.addresses.includes(result.address)) {
        extractedData.push({
          txid: transaction.txid,
          blockHeight: transaction.blockHeight,
          direction: "Incoming",
          txType: "Normal",
          assetType: "ETH",
          senderAddress: transaction.vin.map((vin) => vin.addresses).join(", "),
          receiverAddress: result.address,
          value: viem.formatEther(BigInt(vout.value)),
          fee: viem.formatEther(BigInt(transaction.fees)),
          day,
          timestamp,
          userTimezone,
          status,
          methodNameOrId,
        });
      }
    }

    // Handle internal ETH transfers
    if (transaction.ethereumSpecific?.internalTransfers) {
      for (const transfer of transaction.ethereumSpecific.internalTransfers) {
        if (
          transfer.from === result.address ||
          transfer.to === result.address
        ) {
          const direction =
            transfer.from === result.address ? "Outgoing" : "Incoming";

          extractedData.push({
            txid: transaction.txid,
            blockHeight: transaction.blockHeight,
            direction: direction as "Outgoing" | "Incoming",
            txType: "Internal",
            assetType: "ETH",
            senderAddress: transfer.from,
            receiverAddress: transfer.to,
            value: viem.formatEther(BigInt(transfer.value)),
            fee: viem.formatEther(BigInt(transaction.fees)),
            day,
            timestamp,
            userTimezone,
            status,
            methodNameOrId,
          });
        }
      }
    }

    // Handle token transfers
    if (transaction.tokenTransfers) {
      for (const tokenTransfer of transaction.tokenTransfers) {
        if (
          tokenTransfer.from === result.address ||
          tokenTransfer.to === result.address
        ) {
          const direction =
            tokenTransfer.from === result.address ? "Outgoing" : "Incoming";

          const assetType =
            tokenTransfer.name && tokenTransfer.symbol
              ? `${tokenTransfer.name} (${tokenTransfer.symbol})`
              : "N/A";

          let value = "";
          let tokenId = "";

          switch (tokenTransfer.type) {
            case "ERC1155":
              if (tokenTransfer.multiTokenValues) {
                const tokens = tokenTransfer.multiTokenValues;
                tokens.forEach((token, index) => {
                  tokenId += token.id + (index < tokens.length - 1 ? ", " : "");
                  value +=
                    token.value + (index < tokens.length - 1 ? ", " : "");
                });
              } else {
                // Handle the case where there are no multiTokenValues
                tokenId = "N/A";
                value = "N/A";
              }
              break;
            case "ERC721":
              value = "1";
              tokenId = tokenTransfer.value;
              break;
            case "ERC20":
              // Standard handling for ERC20 tokens using their decimal value
              value = viem.formatUnits(
                BigInt(tokenTransfer.value),
                tokenTransfer.decimals
              );
              tokenId = "N/A";
              break;
            default:
              continue;
          }

          extractedData.push({
            txid: transaction.txid,
            blockHeight: transaction.blockHeight,
            direction: direction as "Outgoing" | "Incoming",
            txType: tokenTransfer.type,
            assetType: assetType,
            senderAddress: tokenTransfer.from,
            receiverAddress: tokenTransfer.to,
            value: value,
            fee: viem.formatEther(BigInt(transaction.fees)),
            day,
            timestamp,
            userTimezone,
            status,
            methodNameOrId,
            contract: tokenTransfer.contract,
            tokenId: tokenId,
          });
        }
      }
    }
  }

  const extendedResult: ExtendedResult = {
    ...result,
    extractedTransaction: extractedData,
    startDate: startOfPeriod,
    endDate: endOfPeriod,
  };

  return extendedResult;
}
