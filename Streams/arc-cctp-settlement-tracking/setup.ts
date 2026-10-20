import fs from 'node:fs';
import crypto from 'node:crypto';
import { database } from './db.ts';

// Use the initial owner connection only to create the example and its application login.
const role = 'cctp_tracker';
const password = crypto.randomBytes(32).toString('hex');
const host = process.env.PGHOST ?? '';
const owner = process.env.PGUSER ?? '';
const suffix = host.endsWith('.pooler.supabase.com') && owner.includes('.') ? owner.slice(owner.indexOf('.')) : '';
const username = `${role}${suffix}`;
const original = fs.readFileSync('.env','utf8');
function setting(text: string, name: string, value: string) {
  const pattern = new RegExp(`^${name}=.*$`,'m');
  const line = `${name}='${value}'`;
  return pattern.test(text) ? text.replace(pattern,()=>line) : `${text.trimEnd()}\n${line}\n`;
}
const updated = setting(setting(original,'PGUSER',username),'PGPASSWORD',password);
const temporary = `.env.setup-${crypto.randomUUID()}.private`;
const client = database();
await client.connect();
let committed = false;
try {
  await client.query('BEGIN');
  await client.query(fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
  await client.query(`CREATE ROLE ${role} LOGIN PASSWORD ${client.escapeLiteral(password)}`);
  await client.query(`
    GRANT USAGE ON SCHEMA public TO ${role};
    GRANT SELECT,INSERT,UPDATE ON cctp_batches,cctp_attestations TO ${role};
    GRANT SELECT ON cctp_legs,cctp_settlements TO ${role};
    CREATE POLICY cctp_tracker_batches ON cctp_batches TO ${role} USING (true) WITH CHECK (true);
    CREATE POLICY cctp_tracker_attestations ON cctp_attestations TO ${role} USING (true) WITH CHECK (true);
  `);
  // Save recoverable credentials before committing, then replace the owner's .env atomically.
  fs.writeFileSync(temporary,updated,{mode:0o600,flag:'wx'});
  await client.query('COMMIT');
  committed = true;
  fs.renameSync(temporary,'.env');
  console.log('Created CCTP tables and views.');
  console.log('Updated .env to use cctp_tracker, a restricted application login.');
} catch (error) {
  if (!committed) await client.query('ROLLBACK');
  else console.error(`Database setup committed. Recover the application environment from ${temporary}.`);
  throw error;
} finally {await client.end();}
