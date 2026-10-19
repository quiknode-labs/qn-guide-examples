export interface BurnLeg {
  canonical_id: string;
  source_domain: number;
  transaction_hash: string;
  message_key: string;
  block_hash: string;
}

export interface IrisMessage {
  status?: string;
  attestation?: string | null;
  message?: string | null;
  eventNonce?: string | null;
}

const hash = /^0x[0-9a-f]{64}$/;
const tm = '0x28b5a0e9c621a5badaa536219b3a228c8168cf5d';
const key = (fields: (string | number)[]) => JSON.stringify(fields.map((field) => String(field).toLowerCase()));

export function messageIdentity(message: string) {
  const raw = message.toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]+$/.test(raw) || raw.length % 2 || raw.length < 752) throw Error('Invalid signed message');
  const hex = (start: number, size: number) => `0x${raw.slice(start * 2, (start + size) * 2)}`;
  const number = (start: number, size: number) => BigInt(hex(start, size)).toString();
  if (number(0, 4) !== '1' || number(148, 4) !== '1') throw Error('Unsupported message version');
  if (hex(44, 32).slice(-40) !== tm.slice(2)) throw Error('Unexpected sender');
  return {
    nonce: hex(12, 32),
    source: Number(number(4, 4)), destination: Number(number(8, 4)),
    key: key([number(4,4),number(8,4),tm,hex(76,32),hex(108,32),number(140,4),hex(152,32),hex(184,32),number(216,32),hex(248,32),number(280,32),`0x${raw.slice(752)}`]),
  };
}

export function matchMessages(legs: BurnLeg[], messages: IrisMessage[]) {
  const updates = [];
  for (const leg of legs) {
    const candidates = [];
    for (const message of messages) {
      if (message.status !== 'complete' || !/^0x[0-9a-f]+$/i.test(message.attestation ?? '') || !message.message) continue;
      const identity = messageIdentity(message.message);
      if (!hash.test(identity.nonce) || /^0x0+$/.test(identity.nonce) || identity.nonce !== message.eventNonce?.toLowerCase()) throw Error('Nonce mismatch');
      if (identity.key === leg.message_key) candidates.push(identity);
    }
    // Identical messages have no unique immutable key. Leave them unresolved.
    if (candidates.length === 1 && legs.filter((other) => other.message_key === leg.message_key).length === 1) {
      updates.push({ ...leg, nonce: candidates[0].nonce, iris_status:'complete', has_attestation:true });
    } else {
      updates.push({ ...leg, nonce:null, iris_status: candidates.length > 0 ? 'ambiguous_message' : messages.length === 0 ? 'not_indexed' : messages.some((m) => m.status !== 'complete') ? 'pending_attestation' : 'message_not_matched', has_attestation:false });
    }
  }
  return updates;
}
