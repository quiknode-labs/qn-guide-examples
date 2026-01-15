import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const QN_STREAMS_API_BASE = 'https://api.quicknode.com/streams/rest/v1';
const STORE_PATH = path.resolve(process.cwd(), '.quicknode', 'streams.json');

type Args = Record<string, string>;

function normalizeKey(key: string) {
  return key.replace(/^--?/, '').toLowerCase().replace(/-/g, '_');
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (const raw of argv) {
    if (!raw) continue;
    if (raw === '--help' || raw === '-h' || raw === 'help') {
      args.help = 'true';
      continue;
    }
    const eqIndex = raw.indexOf('=');
    if (eqIndex === -1) {
      args[normalizeKey(raw)] = 'true';
      continue;
    }
    const key = normalizeKey(raw.slice(0, eqIndex));
    const value = raw.slice(eqIndex + 1);
    args[key] = value;
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  pnpm run activate:streams [stream_id=...]
  pnpm run activate:streams [chain=solana-mainnet]
  pnpm run activate:streams [network=solana-mainnet]

Environment:
  QN_API_KEY=...
`);
}

function readStoredStreamId(chain?: string): string | null {
  if (!fs.existsSync(STORE_PATH)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as {
      last_created?: { id?: string };
      by_chain?: Record<string, { id?: string }>;
    };
    if (chain) {
      return data.by_chain?.[chain]?.id ?? null;
    }
    return data.last_created?.id ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const apiKey = process.env.QN_API_KEY;
  if (!apiKey) {
    console.error('Missing QN_API_KEY');
    process.exit(1);
  }

  const chain = args.chain ?? args.network;
  const streamId = args.stream_id ?? readStoredStreamId(chain);
  if (!streamId) {
    console.error(
      'Missing stream id. Run setup:streams first or pass stream_id=.../chain=...'
    );
    process.exit(1);
  }

  const response = await fetch(
    `${QN_STREAMS_API_BASE}/streams/${encodeURIComponent(streamId)}/activate`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to activate stream (${response.status}): ${errorBody}`
    );
  }

  console.log(`Stream activated: ${streamId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
