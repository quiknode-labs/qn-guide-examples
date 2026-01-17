// filters/solana-filter.js
// Emits events for native SOL transfers and SPL token transfers
// when tx addresses match entries in userstream_monitored_users_sol KV list.
//
// IMPORTANT: Solana addresses are case-sensitive (Base58). Store them exactly as-is in the KV list.
//
// Dataset: "block" (Solana)
// Network: "solana-mainnet" or "solana-devnet"

// SPL Token Programs
const TOKEN_PROGRAMS = new Set([
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // Token Program
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022 Program
]);

// Programs to ignore (don't contribute to meaningful transfers)
const IGNORABLE_PROGRAMS = new Set([
    "Vote111111111111111111111111111111111111111",
    "ComputeBudget111111111111111111111111111111",
    "AddressLookupTab1e1111111111111111111111111",
]);

/**
 * Check if transaction should be skipped (only contains ignorable instructions)
 */
function shouldSkipTransaction(tx) {
    const instructions = tx?.transaction?.message?.instructions || [];
    return (
        instructions.length > 0 &&
        instructions.every((inst) => IGNORABLE_PROGRAMS.has(inst?.programId))
    );
}

/**
 * Get account key as string (handles both string and object formats)
 */
function getAccountKey(key) {
    if (typeof key === "string") return key;
    if (key?.pubkey) return key.pubkey;
    return null;
}

/**
 * Extract signature from transaction
 */
function getSignature(tx) {
    const signatures = tx?.transaction?.signatures;
    if (Array.isArray(signatures) && signatures.length > 0) {
        return signatures[0];
    }
    return null;
}

/**
 * Check if transaction was successful
 */
function isSuccessful(tx) {
    const err = tx?.meta?.err;
    return err === null;
}

async function main(payload) {
    const KV_LIST = "userstream_monitored_users_sol";
    const events = [];

    const { data, metadata } = payload;

    for (const block of data ?? []) {
        const transactions = block?.transactions ?? [];
        if (transactions.length === 0) continue;

        const blockTime = block?.blockTime ?? null;
        const slot = block?.parentSlot ? block.parentSlot + 1 : null;

        // --- Phase 1: Collect all candidate addresses for batch KV lookup ---
        const candidateAddresses = new Set();

        for (const tx of transactions) {
            if (shouldSkipTransaction(tx)) continue;

            const accountKeys = tx?.transaction?.message?.accountKeys || [];
            const preBalances = tx?.meta?.preBalances || [];
            const postBalances = tx?.meta?.postBalances || [];

            // Collect addresses with SOL balance changes
            const n = Math.min(preBalances.length, postBalances.length, accountKeys.length);
            for (let i = 0; i < n; i++) {
                const pre = BigInt(preBalances[i] || 0);
                const post = BigInt(postBalances[i] || 0);
                if (pre !== post) {
                    const addr = getAccountKey(accountKeys[i]);
                    if (addr) candidateAddresses.add(addr);
                }
            }

            // Collect wallet owners from token balance changes
            // This is KEY for detecting incoming SPL transfers!
            const preTokenBalances = tx?.meta?.preTokenBalances || [];
            const postTokenBalances = tx?.meta?.postTokenBalances || [];

            for (const tb of [...preTokenBalances, ...postTokenBalances]) {
                const owner = tb?.owner;
                if (typeof owner === "string" && owner) {
                    candidateAddresses.add(owner);
                }
            }

            // Collect addresses from token transfer instructions (for authority)
            const topLevelInstructions = tx?.transaction?.message?.instructions || [];
            const innerInstructions = (tx?.meta?.innerInstructions || []).flatMap(
                (i) => i?.instructions || []
            );
            const allInstructions = [...topLevelInstructions, ...innerInstructions];

            for (const inst of allInstructions) {
                if (!inst || !TOKEN_PROGRAMS.has(inst.programId)) continue;

                const info = inst?.parsed?.info || {};
                // Collect authority (the wallet signing the transfer)
                for (const addr of [info.authority, info.multisigAuthority]) {
                    if (typeof addr === "string" && addr) {
                        candidateAddresses.add(addr);
                    }
                }
            }
        }

        if (candidateAddresses.size === 0) continue;

        // --- Phase 2: Batch KV lookup ---
        const uniqueAddresses = Array.from(candidateAddresses);
        const hits = await qnLib.qnContainsListItems(KV_LIST, uniqueAddresses);
        const hitMap = new Map(uniqueAddresses.map((a, i) => [a, !!hits[i]]));

        // --- Phase 3: Process transactions and emit events ---
        for (const tx of transactions) {
            if (shouldSkipTransaction(tx)) continue;

            const signature = getSignature(tx);
            if (!signature) continue;

            const success = isSuccessful(tx);
            const status = success ? 1 : 0;

            const accountKeys = tx?.transaction?.message?.accountKeys || [];
            const preBalances = tx?.meta?.preBalances || [];
            const postBalances = tx?.meta?.postBalances || [];

            // --- Native SOL transfers (balance changes) ---
            const n = Math.min(preBalances.length, postBalances.length, accountKeys.length);

            // Build a map of address -> balance delta
            const balanceDeltas = new Map();
            for (let i = 0; i < n; i++) {
                const pre = BigInt(preBalances[i] || 0);
                const post = BigInt(postBalances[i] || 0);
                const delta = post - pre;
                if (delta !== 0n) {
                    const addr = getAccountKey(accountKeys[i]);
                    if (addr) {
                        balanceDeltas.set(addr, delta);
                    }
                }
            }

            // Find monitored addresses with balance changes
            for (const [addr, delta] of balanceDeltas) {
                if (!hitMap.get(addr)) continue;

                // Skip small fee-only changes (likely just transaction fees)
                const absDelta = delta < 0n ? -delta : delta;
                if (absDelta < 10000n) continue;

                const direction = delta > 0n ? "in" : "out";
                const amountLamports = (delta < 0n ? -delta : delta).toString();

                // Try to find counterparty (largest opposite delta)
                let counterparty = null;
                let maxOppositeDelta = 0n;
                for (const [otherAddr, otherDelta] of balanceDeltas) {
                    if (otherAddr === addr) continue;
                    if ((delta > 0n && otherDelta < 0n) || (delta < 0n && otherDelta > 0n)) {
                        const absOther = otherDelta < 0n ? -otherDelta : otherDelta;
                        if (absOther > maxOppositeDelta) {
                            maxOppositeDelta = absOther;
                            counterparty = otherAddr;
                        }
                    }
                }

                events.push({
                    eventId: `${signature}:sol:${addr}`,
                    status,
                    eventType: "solTransfer",
                    matchedAddress: addr,
                    direction,
                    network: metadata?.network,
                    slot,
                    blockTimestamp: blockTime,
                    txHash: signature,
                    data: {
                        amountLamports,
                        counterparty,
                    },
                });
            }

            // --- SPL Token Transfers (using token balance changes) ---
            // This approach uses preTokenBalances/postTokenBalances which include the OWNER address
            const preTokenBalances = tx?.meta?.preTokenBalances || [];
            const postTokenBalances = tx?.meta?.postTokenBalances || [];

            // Build map: accountIndex -> { pre, post, mint, owner }
            const tokenBalanceMap = new Map();

            for (const tb of preTokenBalances) {
                const idx = tb?.accountIndex;
                if (idx === undefined || idx === null) continue;

                const owner = tb?.owner;
                const mint = tb?.mint;
                const amount = tb?.uiTokenAmount?.amount || "0";

                if (!tokenBalanceMap.has(idx)) {
                    tokenBalanceMap.set(idx, { pre: "0", post: "0", mint, owner });
                }
                tokenBalanceMap.get(idx).pre = amount;
                tokenBalanceMap.get(idx).mint = mint;
                tokenBalanceMap.get(idx).owner = owner;
            }

            for (const tb of postTokenBalances) {
                const idx = tb?.accountIndex;
                if (idx === undefined || idx === null) continue;

                const owner = tb?.owner;
                const mint = tb?.mint;
                const amount = tb?.uiTokenAmount?.amount || "0";

                if (!tokenBalanceMap.has(idx)) {
                    tokenBalanceMap.set(idx, { pre: "0", post: "0", mint, owner });
                }
                tokenBalanceMap.get(idx).post = amount;
                // Update owner/mint if not set (account might be new)
                if (!tokenBalanceMap.get(idx).mint) tokenBalanceMap.get(idx).mint = mint;
                if (!tokenBalanceMap.get(idx).owner) tokenBalanceMap.get(idx).owner = owner;
            }

            // Process each token account's balance change
            const processedSplEvents = new Set(); // Dedupe by owner+mint+direction

            for (const [accountIndex, balances] of tokenBalanceMap) {
                const { pre, post, mint, owner } = balances;

                if (!owner || !mint) continue;
                if (!hitMap.get(owner)) continue; // Owner not monitored

                const preBig = BigInt(pre);
                const postBig = BigInt(post);
                const delta = postBig - preBig;

                if (delta === 0n) continue;

                const direction = delta > 0n ? "in" : "out";
                const amountRaw = (delta < 0n ? -delta : delta).toString();

                // Create dedup key
                const dedupKey = `${owner}:${mint}:${direction}`;
                if (processedSplEvents.has(dedupKey)) continue;
                processedSplEvents.add(dedupKey);

                // Find counterparty: another owner with opposite delta for same mint
                let counterparty = null;
                for (const [otherIdx, otherBal] of tokenBalanceMap) {
                    if (otherIdx === accountIndex) continue;
                    if (otherBal.mint !== mint) continue;

                    const otherPre = BigInt(otherBal.pre);
                    const otherPost = BigInt(otherBal.post);
                    const otherDelta = otherPost - otherPre;

                    // Look for opposite sign
                    if ((delta > 0n && otherDelta < 0n) || (delta < 0n && otherDelta > 0n)) {
                        counterparty = otherBal.owner;
                        break;
                    }
                }

                // Get token account address from accountKeys
                const tokenAccount = getAccountKey(accountKeys[accountIndex]);

                events.push({
                    eventId: `${signature}:spl:${accountIndex}`,
                    status,
                    eventType: "splTransfer",
                    matchedAddress: owner,
                    direction,
                    network: metadata?.network,
                    slot,
                    blockTimestamp: blockTime,
                    txHash: signature,
                    data: {
                        mint,
                        amountRaw,
                        tokenAccount,
                        counterparty,
                    },
                });
            }
        }
    }

    return events.length ? { events } : null;
}