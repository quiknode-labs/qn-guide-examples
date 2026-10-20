import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchMessages } from './match.ts';
import type { BurnLeg, IrisMessage } from './match.ts';

const tm = '0x28b5a0e9c621a5badaa536219b3a228c8168cf5d';
const bytes32 = (value: string) => `0x${value.replace(/^0x/, '').padStart(64, '0')}`;
const nonce = bytes32('1234');
const recipient = bytes32(tm);
const caller = bytes32('0');
const token = bytes32('abcd');
const mintRecipient = bytes32('5678');
const depositor = bytes32('9876');

// Encode a V2 burn directly from the documented byte offsets.
function signedMessage() {
  const raw = Buffer.alloc(376);
  const number = (offset: number, size: number, value: number) => {
    raw.set(Buffer.from(value.toString(16).padStart(size * 2, '0'), 'hex'), offset);
  };
  const word = (offset: number, value: string) => raw.set(Buffer.from(value.slice(2), 'hex'), offset);
  number(0, 4, 1);
  number(4, 4, 6);
  number(8, 4, 26);
  word(12, nonce);
  word(44, bytes32(tm));
  word(76, recipient);
  word(108, caller);
  number(140, 4, 1000);
  number(144, 4, 1000);
  number(148, 4, 1);
  word(152, token);
  word(184, mintRecipient);
  number(216, 32, 1000000);
  word(248, depositor);
  number(280, 32, 100);
  return `0x${raw.toString('hex')}`;
}

const leg: BurnLeg = {
  canonical_id: 'burn:1', source_domain: 6,
  transaction_hash: bytes32('a'), block_hash: bytes32('b'),
  message_key: JSON.stringify(['6', '26', tm, recipient, caller, '1000', token, mintRecipient, '1000000', depositor, '100', '0x']),
};
const valid: IrisMessage = { status: 'complete', attestation: '0x1234', message: signedMessage(), eventNonce: nonce };
function replaceWord(offset: number, value: string) {
  const raw = Buffer.from(valid.message!.slice(2), 'hex');
  raw.set(Buffer.from(value.slice(2), 'hex'), offset);
  return `0x${raw.toString('hex')}`;
}

const unrelated: Record<string, IrisMessage> = {
  'another sender': { ...valid, message: replaceWord(44, bytes32('9999')) },
  'another sender with a short custom body': { ...valid, message: replaceWord(44, bytes32('9999')).slice(0, 2 + 150 * 2) },
  'unsupported header version': { ...valid, message: '0x00000000' },
  'unsupported body version': { ...valid, message: `0x${valid.message!.slice(2, 2 + 148 * 2)}00000002` },
  'another burn with inconsistent nonce metadata': { ...valid, message: replaceWord(184, bytes32('ffff')), eventNonce: bytes32('dead') },
};
for (const [description, message] of Object.entries(unrelated)) {
  test(`a valid burn resolves alongside ${description}, in either order`, () => {
    for (const messages of [[message, valid], [valid, message]]) {
      const updates = matchMessages([leg], messages);
      assert.equal(updates.length, 1);
      assert.equal(updates[0].nonce, nonce);
      assert.equal(updates[0].has_attestation, true);
    }
  });
}

test('unrelated messages alone leave the burn unresolved', () => {
  const [update] = matchMessages([leg], Object.values(unrelated));
  assert.equal(update.has_attestation, false);
  assert.equal(update.nonce, null);
  assert.equal(update.iris_status, 'message_not_matched');
});

test('a matching message with inconsistent nonce metadata still fails', () => {
  assert.throws(() => matchMessages([leg], [{ ...valid, eventNonce: bytes32('dead') }]), /Nonce mismatch/);
});

test('a matching message with a zero nonce still fails', () => {
  assert.throws(() => matchMessages([leg], [{ ...valid, message: replaceWord(12, bytes32('0')), eventNonce: bytes32('0') }]), /Nonce mismatch/);
});

test('a truncated supported burn is still rejected', () => {
  assert.throws(() => matchMessages([leg], [{ ...valid, message: valid.message!.slice(0, -2) }]), /Invalid signed message/);
});

test('duplicate matching messages remain ambiguous', () => {
  const [update] = matchMessages([leg], [valid, valid]);
  assert.equal(update.has_attestation, false);
  assert.equal(update.iris_status, 'ambiguous_message');
});

test('indistinguishable source burns remain ambiguous', () => {
  const updates = matchMessages([leg, { ...leg, canonical_id: 'burn:2' }], [valid]);
  assert.ok(updates.every(update => !update.has_attestation && update.iris_status === 'ambiguous_message'));
});
