import { database } from './db.ts';
import { matchMessages } from './match.ts';
import type { BurnLeg, IrisMessage } from './match.ts';

const limit = Number(process.env.RECONCILE_LIMIT ?? 100);
if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw Error('Invalid transaction limit');
const base = process.env.IRIS_BASE_URL ?? 'https://iris-api.circle.com';
const client = database();
await client.connect();
async function record(updates: (BurnLeg & {nonce:string|null; iris_status:string; has_attestation:boolean})[]) {
  await client.query('BEGIN');
  try {
    for (const update of updates) {
      await client.query(`
        INSERT INTO cctp_attestations
          (canonical_id,message_key,block_hash,nonce,iris_status,has_attestation)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (canonical_id) DO UPDATE SET message_key=excluded.message_key,
          block_hash=excluded.block_hash,nonce=excluded.nonce,
          iris_status=excluded.iris_status,has_attestation=excluded.has_attestation,
          checked_at=clock_timestamp()
        WHERE NOT cctp_attestations.has_attestation
           OR cctp_attestations.message_key IS DISTINCT FROM excluded.message_key
           OR cctp_attestations.block_hash IS DISTINCT FROM excluded.block_hash
      `,[update.canonical_id,update.message_key,update.block_hash,update.nonce,
         update.iris_status,update.has_attestation]);
    }
    await client.query('COMMIT');
  } catch (error) {await client.query('ROLLBACK');throw error;}
}
try {
  const lock = await client.query('SELECT pg_try_advisory_lock(260062026) AS acquired');
  if (!lock.rows[0].acquired) throw Error('Another reconciler is running');
  // Limit transactions, then load all their indexed burn legs.
  const { rows } = await client.query<BurnLeg>(`
    WITH transactions AS (
      SELECT l.source_domain,l.transaction_hash,min(l.block_number) AS first_block,
        min(coalesce(a.checked_at,'-infinity'::timestamptz)) AS last_checked
      FROM cctp_legs AS l LEFT JOIN cctp_attestations AS a
        ON a.canonical_id=l.canonical_id
       AND a.message_key=l.message_key AND a.block_hash=l.block_hash
      WHERE l.side='burn' AND NOT coalesce(a.has_attestation,false)
      GROUP BY l.source_domain,l.transaction_hash
      ORDER BY last_checked,first_block,l.source_domain,l.transaction_hash LIMIT $1
    )
    SELECT l.* FROM cctp_legs AS l JOIN transactions AS t USING (source_domain,transaction_hash)
    WHERE l.side='burn' ORDER BY l.source_domain,l.transaction_hash,l.log_index
  `,[limit]);
  const groups = new Map<string, BurnLeg[]>();
  for (const row of rows) {
    const key = `${row.source_domain}:${row.transaction_hash}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  let attested = 0;
  let waiting = 0;
  let errors = 0;
  for (const legs of groups.values()) {
    try {
      const url = new URL(`/v2/messages/${legs[0].source_domain}`, base);
      url.searchParams.set('transactionHash', legs[0].transaction_hash);
      const response = await fetch(url, {signal:AbortSignal.timeout(20000)});
      if (!response.ok && response.status !== 404) throw Error(`Iris HTTP ${response.status}`);
      const body = response.status === 404 ? { messages: [] } : await response.json();
      if (!Array.isArray(body.messages)) throw Error('Invalid Iris response');
      const messages: IrisMessage[] = body.messages;
      const updates = matchMessages(legs, messages);
      await record(updates);
      for (const update of updates) {
        if(update.has_attestation)attested++;else waiting++;
      }
    } catch (error) {
      errors++;
      console.warn(`${legs[0].transaction_hash}: ${error instanceof Error ? error.message : 'Lookup failed'}`);
      // Advance failed attempts too, so one failing transaction cannot starve the queue.
      // record() preserves complete results for the same source observation.
      await record(legs.map((leg) => ({...leg,nonce:null,iris_status:'lookup_error',has_attestation:false})));
    }
  }
  console.log(JSON.stringify({transactions:groups.size,attested,waiting,errors}));
  if(errors)process.exitCode=1;
} finally {await client.end();}
