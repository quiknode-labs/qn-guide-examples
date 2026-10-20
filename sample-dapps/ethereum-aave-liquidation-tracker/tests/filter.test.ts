import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { liquidationPayload } from '../src/lib/payload';

const pool = '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2';
const log = { name: 'LiquidationCall', address: pool, logIndex: '0xa',
  collateralAsset: `0x${'1'.repeat(40)}`, debtAsset: `0x${'2'.repeat(40)}`,
  user: `0x${'3'.repeat(40)}`, liquidator: `0x${'4'.repeat(40)}`,
  receiveAToken: false, debtToCover: '123', liquidatedCollateralAmount: '456' };
const receipt = { status: '0x1', transactionHash: `0x${'a'.repeat(64)}`, decodedLogs: [log] };
const block = { number: '0x1', timestamp: '0x6553f100', hash: `0x${'b'.repeat(64)}` };
const source = readFileSync(new URL('../qn-related/stream.js', import.meta.url), 'utf8');
const main = runInNewContext(`${source}\nmain;`, { decodeEVMReceipts: (receipts: unknown) => receipts });
test('processes every block, preserving timestamps and event identities', () => {
  const result = main({ data: [{ block, receipts: [receipt] },
    { block: { ...block, number: '0x2', timestamp: '0x6553f10c' }, receipts: [receipt] }] });
  assert.equal(result.filteredLogs.length, 2);
  assert.equal(result.filteredLogs[0].logIndex, 10);
  assert.equal(result.filteredLogs[1].blockNumber, '2');
  assert.equal(result.filteredLogs[1].timestamp - result.filteredLogs[0].timestamp, 12);
  assert.equal(result.filteredLogs[0].transactionHash, receipt.transactionHash);
});
test('skips failed receipts and unrelated logs; empty batches return null', () => {
  assert.equal(main({ data: [{ block, receipts: [{ ...receipt, status: '0x0' }] }] }), null);
  assert.equal(main({ data: [{ block, receipts: [{ ...receipt, decodedLogs: [{ ...log, address: `0x${'f'.repeat(40)}` }] }] }] }), null);
  assert.equal(main({ data: [{ block, receipts: [] }] }), null);
});
test('malformed filter input raises an error instead of looking like no matches', () => {
  assert.throws(() => main({ data: [{}] }));
  assert.throws(() => main({ data: null }));
});

test('normalizes Streams string booleans without treating false as truthy', () => {
  const result = main({ data: [{ block, receipts: [{ ...receipt,
    decodedLogs: [{ ...log, receiveAToken: 'false' }, { ...log, logIndex: '0xb', receiveAToken: 'true' }] }] }] });
  assert.equal(result.filteredLogs[0].receiveAToken, false);
  assert.equal(result.filteredLogs[1].receiveAToken, true);
});

test('valid filter output above 100 events is accepted by the receiver schema', () => {
  const logs = Array.from({ length: 101 }, (_, index) => ({ ...log, logIndex: `0x${index.toString(16)}` }));
  const result = main({ data: [{ block, receipts: [{ ...receipt, decodedLogs: logs }] }] });
  assert.equal(liquidationPayload.safeParse(result).success, true);
});
