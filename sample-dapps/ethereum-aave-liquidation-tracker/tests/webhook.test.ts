import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { encodeAbiParameters, parseAbiParameters, toFunctionSelector } from 'viem';
import { createWebhookApp } from '../src/lib/webhook';
import { verifyWebhookSignature } from '../src/lib/security';
import type { LiquidationPayload } from '../src/lib/payload';

const secret = 'local-test-stream-secret';
const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const payload: LiquidationPayload = {
  timestamp: 1700000000,
  filteredLogs: [{ collateralAsset: address(1), debtAsset: address(2), user: address(3),
    liquidator: address(4), debtToCover: '123456789123456789123456',
    liquidatedCollateralAmount: '987654321987654321987654', receiveAToken: false,
    transactionHash: `0x${'a'.repeat(64)}`, blockHash: `0x${'b'.repeat(64)}`,
    blockNumber: '18983377', logIndex: 10, timestamp: 1700000000 }],
};
const sign = (body: Buffer) => ({ 'x-qn-nonce': 'test-nonce', 'x-qn-timestamp': '1700000000',
  'x-qn-signature': createHmac('sha256', secret).update('test-nonce1700000000').update(body).digest('hex') });
let failStore = false, failRpc = false, writes = 0;
const rows = new Map<string, Record<string, unknown>>();
const mock = createServer(async (req, res) => {
  let raw = ''; for await (const chunk of req) raw += chunk;
  res.setHeader('content-type', 'application/json');
  if (req.url?.startsWith('/rest/v1/liquidations')) {
    if (failStore) { res.writeHead(503); res.end(JSON.stringify({ message: 'storage unavailable' })); return; }
    assert.equal(req.headers.apikey, 'backend-only-test-key');
    assert.match(req.headers.prefer ?? '', /resolution=merge-duplicates/);
    assert.equal(new URL(req.url, 'http://localhost').searchParams.get('on_conflict'), 'transaction_hash,log_index');
    const batch = JSON.parse(raw) as Record<string, unknown>[];
    for (const row of batch) rows.set(`${row.transaction_hash}:${row.log_index}`, row);
    writes++; res.writeHead(201); res.end(''); return;
  }
  const rpc = JSON.parse(raw);
  if (failRpc) { res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, error: { code: -32000, message: 'RPC unavailable' } })); return; }
  if (rpc.method === 'eth_chainId') { res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result: '0x1' })); return; }
  const selector = rpc.params[0].data.slice(0, 10);
  let result;
  if (selector === toFunctionSelector('name()')) result = encodeAbiParameters(parseAbiParameters('string'), ['Token']);
  else if (selector === toFunctionSelector('symbol()')) result = encodeAbiParameters(parseAbiParameters('string'), ['TKN']);
  else if (selector === toFunctionSelector('decimals()')) result = encodeAbiParameters(parseAbiParameters('uint8'), [18]);
  else if (selector === toFunctionSelector('BASE_CURRENCY_UNIT()')) result = encodeAbiParameters(parseAbiParameters('uint256'), [100000000n]);
  else { assert.equal(selector, toFunctionSelector('getAssetsPrices(address[])'));
    assert.equal(rpc.params[1], '0x121a9d1');
    result = encodeAbiParameters(parseAbiParameters('uint256[]'), [[200000000n, 100000000n]]); }
  res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result }));
});
await new Promise<void>(resolve => mock.listen(0, '127.0.0.1', resolve));
const mockAddress = mock.address(); if (!mockAddress || typeof mockAddress === 'string') throw new Error('No mock port');
const mockUrl = `http://127.0.0.1:${mockAddress.port}`;
process.env.SUPABASE_URL = mockUrl;
process.env.SUPABASE_SECRET_KEY = 'backend-only-test-key';
process.env.QUICKNODE_RPC_URL = mockUrl;
const { processLiquidationData } = await import('../src/lib/transform');
const server = createWebhookApp(secret, processLiquidationData).listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const serverAddress = server.address(); if (!serverAddress || typeof serverAddress === 'string') throw new Error('No server port');
const url = `http://127.0.0.1:${serverAddress.port}/webhook`;
after(async () => {
  await Promise.all([new Promise<void>(resolve => server.close(() => resolve())),
    new Promise<void>(resolve => mock.close(() => resolve()))]);
});
async function send(value: unknown, headers: Record<string, string> = {}) {
  const body = Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
  return fetch(url, { method: 'POST', headers: { ...sign(body), ...headers }, body });
}

test('requires a configured secret and rejects missing headers, invalid length, and tampering', async () => {
  assert.throws(() => createWebhookApp('', processLiquidationData));
  assert.equal((await fetch(url, { method: 'POST', body: JSON.stringify(payload) })).status, 401);
  assert.equal((await send(payload, { 'x-qn-signature': 'bad' })).status, 401);
  const body = Buffer.from(JSON.stringify(payload));
  assert.equal(verifyWebhookSignature(Buffer.concat([body, Buffer.from(' ')]), 'test-nonce', '1700000000', sign(body)['x-qn-signature'], secret), false);
  assert.equal(writes, 0);
});
test('rejects signed invalid JSON, missing event identity, compression, and oversized bodies', async () => {
  assert.equal((await send('invalid json')).status, 400);
  assert.equal((await send({ timestamp: 1, filteredLogs: [{}] })).status, 400);
  assert.equal((await send(payload, { 'content-encoding': 'gzip' })).status, 415);
  assert.equal((await send(' '.repeat(1048577))).status, 413);
  assert.equal(writes, 0);
});
test('persists before success, accepts raw bytes without JSON Content-Type, and deduplicates replays', async () => {
  assert.equal((await send(payload)).status, 200);
  assert.equal(rows.size, 1);
  const first = [...rows.values()][0];
  assert.equal(first.log_index, 10); assert.equal(first.block_hash, payload.filteredLogs[0].blockHash);
  assert.equal(first.debt_repaid_amount, '123456.789123456789123456');
  assert.equal((await send(payload, { 'content-type': 'application/octet-stream' })).status, 200);
  assert.equal(rows.size, 1);
});
test('storage failure returns retryable response; retry succeeds without duplicate rows', async () => {
  failStore = true; assert.equal((await send(payload)).status, 503);
  failStore = false; assert.equal((await send(payload)).status, 200); assert.equal(rows.size, 1);
});
test('an enrichment failure fails the whole batch without a partial write', async () => {
  const before = writes; failRpc = true;
  assert.equal((await send(payload)).status, 503); assert.equal(writes, before); failRpc = false;
});
test('retains multiple logs from one transaction and each event timestamp', async () => {
  const batch = structuredClone(payload);
  batch.filteredLogs.push({ ...batch.filteredLogs[0], logIndex: 11, timestamp: 1700000012 });
  assert.equal((await send(batch)).status, 200); assert.equal(rows.size, 2);
  assert.equal(rows.get(`${batch.filteredLogs[1].transactionHash}:11`)?.timestamp, '2023-11-14T22:13:32.000Z');
});

test('holds the response until processing has finished', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let entered!: () => void;
  const processing = new Promise<void>(resolve => { entered = resolve; });
  const held = createWebhookApp(secret, async data => {
    entered(); await gate; return { processedLiquidations: data.filteredLogs.length };
  }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => held.once('listening', resolve));
  const heldPort = (held.address() as { port: number }).port;
  const body = Buffer.from(JSON.stringify(payload));
  let settled = false;
  const response = fetch(`http://127.0.0.1:${heldPort}/webhook`, {
    method: 'POST', headers: sign(body), body,
  }).then(result => { settled = true; return result; });
  try {
    await processing;
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(settled, false);
    release(); assert.equal((await response).status, 200);
  } finally {
    release(); await new Promise<void>(resolve => held.close(() => resolve()));
  }
});

test('rate limits repeated requests before signature or database processing', async () => {
  const body = Buffer.from(JSON.stringify(payload));
  let limited: Response | undefined;
  for (let index = 0; index < 121; index++) {
    const result = await fetch(url, { method: 'POST', body });
    if (result.status === 429) { limited = result; break; }
    assert.equal(result.status, 401);
  }
  assert.ok(limited);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
});
