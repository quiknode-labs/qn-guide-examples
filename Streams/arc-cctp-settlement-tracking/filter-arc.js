// Quicknode Streams logs filter. Constants select one verified mainnet.
const NETWORK = 'arc-mainnet';
const CHAIN_ID = '5042';
const DOMAIN = 26;
const USDC = '0x3600000000000000000000000000000000000000';
const PARTNER_DOMAIN = 6;
const TM = '0x28b5a0e9c621a5badaa536219b3a228c8168cf5d';
const MT = '0x81d40f21f12a8f0e3252bccb954d722d4c464b64';
const BURN = '0x0c8c1cbdc5190613ebd485511d4e2812cfa45eecb79d845893331fedad5130a5';
const RECEIVE = '0xff48c13eda96b1cceacc6b9edeedc9e9db9d6226afbc30146b720c19d3addb1c';
const SOURCE_USDC = {
  6: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  26: '0x3600000000000000000000000000000000000000',
};
const HEX = /^0x(?:[0-9a-f]{2})*$/;
const HASH = /^0x[0-9a-f]{64}$/;
const padded = (address) => `0x${address.slice(2).padStart(64, '0')}`;
const word = (hex, index) => `0x${hex.slice(2 + index * 64, 66 + index * 64)}`;
const uint = (hex) => BigInt(hex).toString();
const address = (hex) => `0x${hex.slice(-40)}`;

function bytes(data, offsetWord) {
  const offset = Number(BigInt(word(data, offsetWord)));
  if (!Number.isSafeInteger(offset) || offset % 32 || offset < (offsetWord + 1) * 32) throw Error('Invalid ABI offset');
  const length = Number(BigInt(`0x${data.slice(2 + offset * 2, 66 + offset * 2)}`));
  if (!Number.isSafeInteger(length) || length < 0 || (offset + 32 + length) * 2 > data.length - 2) throw Error('Truncated ABI bytes');
  return `0x${data.slice(66 + offset * 2, 66 + (offset + length) * 2)}`;
}

function collect(value, logs) {
  if (Array.isArray(value)) for (const child of value) collect(child, logs);
  else if (value && typeof value.address === 'string' && Array.isArray(value.topics)) logs.push(value);
}

function key(fields) {
  return JSON.stringify(fields.map((field) => String(field).toLowerCase()));
}

function main(stream) {
  if (stream.metadata.network !== NETWORK) throw Error('Filter network mismatch');
  const logs = [];
  collect(stream.data, logs);
  const legs = [];
  for (const raw of logs) {
    const emitter = raw.address.toLowerCase();
    const topics = raw.topics.map((value) => value.toLowerCase());
    const side = emitter === TM && topics[0] === BURN ? 'burn' : emitter === MT && topics[0] === RECEIVE ? 'receive' : null;
    if (!side || raw.removed === true) continue;
    const data = raw.data.toLowerCase();
    if (topics.length !== 4 || !topics.every((topic) => HASH.test(topic)) || !HEX.test(data)) throw Error('Invalid CCTP log');
    const block = uint(raw.blockNumber);
    const index = uint(raw.logIndex);
    if (!HASH.test(raw.transactionHash.toLowerCase()) || !HASH.test(raw.blockHash.toLowerCase())) throw Error('Invalid event identity');
    if (BigInt(block) < BigInt(stream.metadata.batch_start_range) || BigInt(block) > BigInt(stream.metadata.batch_end_range)) throw Error('Event outside batch');
    const timestamp = Number(BigInt(raw.blockTimestamp));
    if (!Number.isSafeInteger(timestamp)) throw Error('Invalid timestamp');
    const leg = {
      canonical_id: `${CHAIN_ID}:${raw.transactionHash.toLowerCase()}:${index}`,
      network: NETWORK, chain_id: CHAIN_ID, side,
      transaction_hash: raw.transactionHash.toLowerCase(), log_index: index,
      block_number: block, block_hash: raw.blockHash.toLowerCase(),
      block_timestamp: new Date(timestamp * 1000).toISOString(),
      emitter_address: emitter,
    };
    if (side === 'burn') {
      if (address(topics[1]) !== USDC || Number(BigInt(word(data, 2))) !== PARTNER_DOMAIN) continue;
      if (data.length < 2 + 8 * 64) throw Error('Truncated burn');
      const hook = bytes(data, 6);
      Object.assign(leg, {
        source_domain: DOMAIN, destination_domain: Number(BigInt(word(data, 2))),
        amount_raw: uint(word(data, 0)), burn_token: address(topics[1]),
        depositor: address(topics[2]), mint_recipient: word(data, 1),
        destination_caller: word(data, 4), max_fee_raw: uint(word(data, 5)),
        min_finality_threshold: Number(BigInt(topics[3])),
        message_key: key([DOMAIN, uint(word(data, 2)), TM, word(data, 3), word(data, 4), uint(topics[3]), topics[1], word(data, 1), uint(word(data, 0)), topics[2], uint(word(data, 5)), hook]),
      });
    } else {
      if (data.length < 2 + 4 * 64 || word(data, 1) !== padded(TM)) continue;
      const source = Number(BigInt(word(data, 0)));
      if (source !== PARTNER_DOMAIN) continue;
      const body = bytes(data, 2);
      if (body.length < 2 + 228 * 2 || body.slice(2, 10) !== '00000001') throw Error('Unsupported CCTP burn body');
      const token = `0x${body.slice(10, 74)}`;
      if (address(token) !== SOURCE_USDC[source]) continue;
      const amount = BigInt(`0x${body.slice(138, 202)}`);
      const fee = BigInt(`0x${body.slice(330, 394)}`);
      if (fee > amount || /^0x0+$/.test(topics[2])) throw Error('Invalid receive');
      Object.assign(leg, {
        source_domain: source, destination_domain: DOMAIN, nonce: topics[2],
        sender: word(data, 1), finality_threshold_executed: Number(BigInt(topics[3])),
        amount_raw: amount.toString(), fee_raw: fee.toString(), net_amount_raw: (amount - fee).toString(),
        mint_recipient: `0x${body.slice(74, 138)}`,
      });
    }
    legs.push(leg);
  }
  // Empty batches must overwrite displaced events after a source-chain reorg.
  return { filter_version: '4.0.0', network: NETWORK, legs };
}
