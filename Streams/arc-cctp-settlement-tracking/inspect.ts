import fs from 'node:fs';
import { database } from './db.ts';

const client = database();
await client.connect();
try {
  const {rows} = await client.query(fs.readFileSync(new URL('./inspect.sql',import.meta.url),'utf8'));
  console.table(rows);
} finally {await client.end();}
