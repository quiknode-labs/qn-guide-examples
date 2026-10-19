import fs from 'node:fs';
import pg from 'pg';

export function database() {
  return new pg.Client({
    connectionTimeoutMillis: 10000,
    ssl: process.env.PGSSLMODE === 'disable' ? false : {
      rejectUnauthorized: true,
      ...(process.env.PGSSLROOTCERT ? {ca:fs.readFileSync(process.env.PGSSLROOTCERT,'utf8')} : {}),
    },
  });
}
