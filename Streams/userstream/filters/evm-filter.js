// filters/evm-filter.js
// Emits events for native ETH transfers and ERC-20 Transfer logs
// when tx/log from/to matches addresses in userstream_monitored_users_evm KV list.
//
// IMPORTANT: Store addresses in the KV list in LOWERCASE, since this filter normalizes to lowercase.

const TRANSFER_TOPIC0 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function normAddr(a) {
  return a ? a.toLowerCase() : null;
}

function topicToAddress(topic) {
  // topic is 32-byte hex, address is last 20 bytes (40 hex chars)
  if (
    !topic ||
    typeof topic !== "string" ||
    !topic.startsWith("0x") ||
    topic.length < 66
  )
    return null;
  return ("0x" + topic.slice(-40)).toLowerCase();
}

function hexToBigInt(hex) {
  if (!hex || typeof hex !== "string") return 0n;
  return BigInt(hex); // supports "0x0"
}

function hexToInt(hex) {
  if (!hex || typeof hex !== "string") return null;
  return parseInt(hex, 16);
}

async function main(payload) {
  const KV_LIST = "userstream_monitored_users_evm";
  const events = [];

  const { data, metadata } = payload;

  for (const item of data ?? []) {
    const block = item.block;
    const receipts = item.receipts ?? [];
    if (!block) continue;

    // Map receipts by tx hash
    const receiptByHash = new Map();
    for (const r of receipts) {
      if (r?.transactionHash) receiptByHash.set(r.transactionHash, r);
    }

    // Collect candidate addresses for ONE KV lookup:
    // - tx.from / tx.to
    // - ERC-20 Transfer log from/to
    const addressSet = new Set();

    for (const tx of block.transactions ?? []) {
      if (tx.from) addressSet.add(normAddr(tx.from));
      if (tx.to) addressSet.add(normAddr(tx.to));
    }

    for (const r of receipts) {
      for (const log of r?.logs ?? []) {
        if (!log?.topics?.length) continue;
        if (normAddr(log.topics[0]) !== TRANSFER_TOPIC0) continue;

        const from = topicToAddress(log.topics[1]);
        const to = topicToAddress(log.topics[2]);
        if (from) addressSet.add(from);
        if (to) addressSet.add(to);
      }
    }

    addressSet.delete(null);

    if (addressSet.size === 0) continue;

    const addresses = Array.from(addressSet);
    const hits = await qnLib.qnContainsListItems(KV_LIST, addresses);
    const hitMap = new Map(addresses.map((a, i) => [a, hits[i]]));

    const blockNumber = hexToInt(block.number);
    const blockTimestamp = hexToInt(block.timestamp);

    // --- Native transfers (tx.value) ---
    for (const tx of block.transactions ?? []) {
      const from = normAddr(tx.from);
      const to = normAddr(tx.to);

      const isFromMonitored = from && hitMap.get(from);
      const isToMonitored = to && hitMap.get(to);
      if (!isFromMonitored && !isToMonitored) continue;

      const valueWei = tx.value ? hexToBigInt(tx.value) : 0n;
      if (valueWei === 0n) continue;

      const matchedAddress = isFromMonitored ? from : to;
      const direction = isFromMonitored ? "out" : "in";
      const counterparty = isFromMonitored ? to : from;

      const receipt = tx.hash ? receiptByHash.get(tx.hash) : null;
      const status = receipt?.status ? hexToInt(receipt.status) : null;

      events.push({
        eventId: `${tx.hash}:native`,
        status, // 1 = success, 0 = failure, null if unavailable
        eventType: "nativeTransfer",
        matchedAddress,
        direction,
        network: metadata?.network,
        blockNumber,
        blockTimestamp,
        txHash: tx.hash,
        data: {
          amountWei: valueWei.toString(),
          from,
          to,
          counterparty,
        },
      });
    }

    // --- ERC-20 Transfer events (receipt logs) ---
    for (const r of receipts) {
      const txHash = r?.transactionHash;
      if (!txHash) continue;

      const status = r?.status ? hexToInt(r.status) : null;

      for (const log of r?.logs ?? []) {
        if (!log?.topics?.length) continue;
        if (normAddr(log.topics[0]) !== TRANSFER_TOPIC0) continue;

        const from = topicToAddress(log.topics[1]);
        const to = topicToAddress(log.topics[2]);

        const isFromMonitored = from && hitMap.get(from);
        const isToMonitored = to && hitMap.get(to);
        if (!isFromMonitored && !isToMonitored) continue;

        const matchedAddress = isFromMonitored ? from : to;
        const direction = isFromMonitored ? "out" : "in";
        const counterparty = isFromMonitored ? to : from;

        const amountRaw = log.data ? hexToBigInt(log.data) : 0n;
        const logIndex = log.logIndex ? hexToInt(log.logIndex) : null;

        events.push({
          eventId: `${txHash}:${logIndex ?? "unknown"}`,
          status, // 1 = success, 0 = failure, null if unavailable
          eventType: "erc20Transfer",
          matchedAddress,
          direction,
          network: metadata?.network,
          blockNumber,
          blockTimestamp,
          txHash,
          logIndex,
          data: {
            tokenAddress: normAddr(log.address),
            amountRaw: amountRaw.toString(), // uint256, not adjusted for decimals
            from,
            to,
            counterparty,
          },
        });
      }
    }
  }

  return events.length ? { events } : null;
}
