// Import necessary types and libraries
import { DateTime } from "luxon";
import {
  Result,
  ExtendedTransaction,
  ExtendedResult,
  CalculateVariablesOptions,
} from "../interfaces";
import { bb_gettickers } from "./blockbookMethods";

export async function calculateVariables(
  result: Result,
  options: CalculateVariablesOptions = {}
  // Default to end of current date in local timezone
): Promise<ExtendedResult> {
  const userTimezone = options.userTimezone || DateTime.local().zoneName; // Default to local timezone if not provided
  const startDate = options.startDate || DateTime.now().setZone(userTimezone); // Default to start of current date in specified or local timezone
  const endDate = options.endDate || DateTime.now().setZone(userTimezone); // Default to end of current date in specified or local timezone

  // userTimezone: string = DateTime.local().zoneName // Default to local timezone
  const extendedTransactions = [];

  // Convert start and end dates to the beginning and end of their respective days in the user's timezone
  const startOfPeriod = startDate.startOf("day");
  const endOfPeriod = endDate.endOf("day");

  // Conversion rate from Satoshi to BTC
  const btcToSatoshi = 100000000;

  // Convert the string currentBalance to a number for calculations, then back to string for storage.
  const currentBalance = parseFloat(result.balance) / btcToSatoshi;

  let direction;
  let balanceBeforeTx = 0,
    balanceAfterTx = 0,
    cumulativeDiff = 0;

  // Iterate through each transaction associated with the address
  for (const transaction of result.transactions) {
    const blockTime = DateTime.fromMillis(transaction.blockTime * 1000, {
      zone: userTimezone,
    });

    const withinInterval =
      blockTime >= startOfPeriod && blockTime <= endOfPeriod ? true : false;

    // Format the date and timestamp for the report
    const day = blockTime.toFormat("yyyy-MM-dd");
    const timestamp: string = blockTime.toString() || ""; // ISO 8601 format, includes date and time

    // Determine if the address is the sender in any of the transaction inputs
    const vinIsSender = transaction.vin.some((vin) =>
      vin.addresses.includes(result.address)
    );

    // Determine if the transaction is confirmed
    const type = transaction.confirmations === 0 ? "Unconfirmed" : "Confirmed";

    // Assign transaction direction based on the address's role
    direction = vinIsSender ? "Outgoing" : "Incoming";

    let fromAddresses = "";
    let toAddresses = "";
    let btcAmount = 0,
      usdAmount = 0,
      btcFees = 0,
      usdFees = 0;

    // Logic for when the address is the sender
    if (vinIsSender) {
      // Filter the transaction inputs (vin) to find those that include the data address
      // indicating transactions where our address sent Bitcoin
      const vinSelfRecipient = transaction.vin.filter((vin) =>
        vin.addresses.includes(result.address)
      );

      // Check if there's a "sent-back" transaction by looking for outputs (vout) that include the data address
      const isSentBack = transaction.vout.some(
        (vout) => vout.addresses && vout.addresses.includes(result.address)
      );

      // Filter the transaction outputs (vout) to exclude those that are sent back to the sender's address,
      // focusing on the actual transaction outputs to other addresses
      const voutRecipient = transaction.vout.filter(
        (vout) => !vout.addresses.includes(result.address)
      );

      // Filter the transaction outputs (vout) to find those that include the data address
      // indicating transactions with our address
      const voutSelfRecipient = transaction.vout.filter((vout) =>
        vout.addresses.includes(result.address)
      );

      // This calculation determines the actual amount which is associated with the data address
      if (isSentBack) {
        const btcAmountIn = vinSelfRecipient.reduce(
          (acc, vin) => acc + parseFloat(vin.value),
          0
        );

        const btcAmountOut = voutSelfRecipient.reduce(
          (acc, vout) => acc + parseFloat(vout.value),
          0
        );

        btcAmount = (btcAmountIn - btcAmountOut) / btcToSatoshi;
      } else {
        btcAmount =
          vinSelfRecipient.reduce(
            (acc, vin) => acc + parseFloat(vin.value),
            0
          ) / btcToSatoshi;
      }

      fromAddresses = result.address; // The sender address
      toAddresses = voutRecipient
        .map((vout) => vout.addresses.join(", "))
        .join(", "); // Concatenate recipient addresses
    } else {
      // Logic for when the address is the recipient
      btcAmount =
        transaction.vout
          .filter((vout) => vout.addresses.includes(result.address))
          .reduce((acc, vout) => acc + parseFloat(vout.value), 0) /
        btcToSatoshi;

      fromAddresses = transaction.vin
        .map((vin) => vin.addresses.join(", "))
        .join(", "); // Concatenate sender addresses
      toAddresses = result.address; // The recipient address
    }

    if (withinInterval) {
      // Fetch the current price data for accurate USD conversion
      const priceData = await bb_gettickers(transaction.blockTime);

      // Calculate fees and amounts in USD
      btcFees = parseFloat(transaction.fees) / btcToSatoshi;
      usdFees = btcFees * priceData.rates.usd;
      usdAmount = btcAmount * priceData.rates.usd;
    }

    if (direction === "Outgoing") {
      cumulativeDiff -= btcAmount;
    } else {
      cumulativeDiff += btcAmount;
    }

    balanceBeforeTx = currentBalance - cumulativeDiff;

    if (direction === "Outgoing") {
      balanceAfterTx = balanceBeforeTx - btcAmount;
    } else {
      balanceAfterTx = balanceBeforeTx + btcAmount;
    }

    const extendedTransaction: ExtendedTransaction = {
      ...transaction,
      day,
      timestamp,
      userTimezone,
      direction,
      fromAddresses,
      toAddresses,
      btcAmount,
      usdAmount,
      btcFees,
      usdFees,
      type,
      balanceBeforeTx,
      balanceAfterTx,
      withinInterval,
    };

    extendedTransactions.push(extendedTransaction);
  }

  // Filter transactions which are in the time interval
  const filteredTransactions = extendedTransactions.filter(
    (transaction) => transaction.withinInterval
  );

  // Destructure the original result to exclude the transactions property

  const { transactions, ...rest } = result; // eslint-disable-line @typescript-eslint/no-unused-vars

  // Use the rest of the properties and add the extendedTransactions
  const extendedResult: ExtendedResult = {
    ...rest,
    extendedTransactions: filteredTransactions,
    startDate: startOfPeriod,
    endDate: endOfPeriod,
  };

  return extendedResult;
}
