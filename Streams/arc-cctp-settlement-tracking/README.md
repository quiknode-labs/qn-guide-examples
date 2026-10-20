# CCTP Settlement Tracker: Base and Arc

Track USDC transfers into and out of Arc with two Quicknode Streams, Circle's message API, and PostgreSQL. The [Quicknode guide](https://www.quicknode.com/guides/arc/track-cctp-settlement-into-and-out-of-arc) explains the transfer lifecycle and event matching.

## Requirements

- Node.js 24 and npm
- An authenticated Quicknode CLI (`qn auth login`)
- Hosted PostgreSQL 15 or newer reachable by Streams over TLS
- Database owner access for the one-time setup

No wallet or transaction submission is needed. The default walkthrough indexes one existing transfer from Base to Arc. Each filter also handles the reverse direction.

## Setup

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/Streams/arc-cctp-settlement-tracking
npm install
cp .env.example .env
chmod 600 .env
```

Fill `.env` using the database connection values described below. Then run:

```bash
npm run setup
npm run prepare-streams
```

Setup creates the tables and views from `schema.sql`, generates a password for `cctp_tracker`, and replaces the initial owner username/password in `.env` with that restricted login. The application login can read and write the two example tables and read its views. It cannot create roles or tables and receives no access through the Supabase Data API roles.

Run setup once. It creates fresh objects and a role; it does not overwrite or migrate an existing installation. The generated login is used by both Streams and the worker for this walkthrough.

`npm run prepare-streams` creates `stream-config/base.private.json` and `stream-config/arc.private.json` locally. They are not checked into the repository because they include database credentials from `.env`; `.gitignore` excludes them. Run this command from the project directory shown above.

The Base config selects Base mainnet, the Logs dataset, `filter-base.js`, and start/end block 52627678. The Arc config selects Arc mainnet, Logs, `filter-arc.js`, and start/end block 26048044. Both use one-block batches and the PostgreSQL table `cctp_batches` over TLS. Base enables reorg correction; Arc leaves it disabled. These settings also describe the equivalent dashboard configuration, using each filter file's source and the application credentials saved by setup.

Create the two Streams using the generated private configurations:

```bash
qn stream create --stream-config-file stream-config/base.private.json --format table
qn stream create --stream-config-file stream-config/arc.private.json --format table
```

Each covers one known block. Wait for both Streams to report `completed`, with `sequence` equal to `end_range`:

```bash
qn stream show <STREAM_ID> --format table
npm run reconcile
npm run inspect
```

The resolved transfer should have source domain 6, destination domain 26, status `settled`, 102.665844 USDC burned, a 0.019601 USDC fee, and 102.646243 USDC received. A repeated reconciliation run should select zero transactions once its mapping is complete.

## Database Connection

Initially, `.env` holds the provider's owner connection so setup can create the example:

```dotenv
PGHOST='<POSTGRES_HOST>'
PGPORT=5432
PGDATABASE=postgres
PGUSER='<DATABASE_OWNER_USERNAME>'
PGPASSWORD='<DATABASE_OWNER_PASSWORD>'
PGSSLMODE=verify-full
```

For Supabase, use the **session pooler** details from the project's Connect dialog. The owner username is normally `postgres.<PROJECT_REF>`. Setup preserves that pooler suffix when switching to `cctp_tracker.<PROJECT_REF>`. Direct connections use `cctp_tracker`. Avoid transaction pooling: the worker's advisory lock requires the same database session during a run.

If Node reports an untrusted certificate chain, download the provider's public root certificate from its database settings and add:

```dotenv
PGSSLROOTCERT='/absolute/path/to/provider-ca.crt'
```

TLS verification stays enabled. See [Supabase's connection documentation](https://supabase.com/docs/guides/database/connecting-to-postgres). Streams also requires a reachable database host; `localhost` on your computer is not a hosted destination.

Node reads `.env` directly, so there is no Bash sourcing or owner-password prompt. Keep password values quoted. Setup writes the generated environment with mode 600 and does not print passwords. If the database commit succeeds but replacing `.env` fails, the error identifies a private recovery file containing the application connection settings. Rename that file to `.env` before continuing. A later schema change needs the owner's connection from the provider, not the restricted application login.

For isolated local database development only, `PGSSLMODE=disable` disables TLS for Node commands. This does not configure an externally reachable Streams destination.

## Project Files

| File | Purpose |
| --- | --- |
| `filter-arc.js`, `filter-base.js` | Decode USDC burn and receive events for the pair |
| `schema.sql` | Store deliveries and expose legs, message mappings, and settlements |
| `setup.ts`, `db.ts` | Initialize the database and configure verified connections |
| `match.ts`, `reconcile.ts` | Match signed messages and resolve burns |
| `prepare-streams.ts` | Generate two default configs; never creates Streams itself |
| `inspect.ts`, `inspect.sql` | Query settlement records |
| `roles.sql` | Optional separate writer and reconciler roles |

The two `.js` files are JavaScript because they execute in the Streams filter runtime. Local application scripts use TypeScript and run directly on Node 24.

## Ongoing Transfers

The default feeds have identical start and end blocks, so they stop after processing one block. Continuous feeds follow new blocks without a fixed stopping point. Choose starting blocks for the history you need on both networks and generate continuous feeds:

```bash
npm run prepare-streams -- --continuous \
  --base-start <BASE_START_BLOCK> --arc-start <ARC_START_BLOCK>
```

This overwrites `base.private.json` and `arc.private.json` with `end_range: -1`, the API setting for continuous ingestion. It does not update a hosted Stream or create another one. Inspect the configs, then run the two `qn stream create --stream-config-file ... --format table` commands from Setup again to create the ongoing feeds. Keep one active feed per network; additional overlapping feeds are unnecessary.

Schedule `npm run reconcile` regularly. It processes at most `RECONCILE_LIMIT` source transactions per run (default 100), revisits pending and failed lookups, and skips completed mappings. A session advisory lock prevents concurrent workers. Monitor failed exits, ingestion lag, database growth, and message lookup rates.

## Additional Validation Transfers

The main walkthrough only needs two Streams. For development validation of both directions, generate the four earlier single-block cases explicitly:

```bash
npm run prepare-streams -- --validation
```

| Config | Network | Block |
| --- | --- | ---: |
| `base-burn.private.json` | base-mainnet | 52627678 |
| `arc-receive.private.json` | arc-mainnet | 26048044 |
| `arc-burn.private.json` | arc-mainnet | 26034675 |
| `base-receive.private.json` | base-mainnet | 52624297 |

Creating these additional Streams is optional. Their files remain private and should not be committed. The reverse transfer burned 90 USDC and received 89.945613 USDC with a 0.054387 USDC fee. `settle_seconds` is the difference between source and destination block timestamps, not ingestion latency.

## Separate Database Roles

For an independently operated worker and Stream destination, `roles.sql` creates `cctp_writer` and `cctp_reconciler` with separate privileges and RLS policies. This is optional for the tutorial's single restricted application login.

Run the file through `psql` as the database owner after exporting `CCTP_WRITER_PASSWORD` and `CCTP_RECONCILER_PASSWORD` with your chosen role passwords. `roles.sql` reads them with psql's `\getenv`. Set the worker's `PGUSER` and `PGPASSWORD` to the reconciler connection and add `STREAM_PGUSER` and `STREAM_PGPASSWORD` for the writer before regenerating configurations. Supabase session-pooler connection usernames need the `.<PROJECT_REF>` suffix; the SQL role names do not.

## Matching and Replacement Behavior

The worker matches immutable message fields, not API array positions, and processes all indexed burns of a selected transaction together. It skips unrelated senders and unsupported message versions, and validates nonce metadata only for matching burns. Indistinguishable messages remain unresolved. A completed response must include a signed message and attestation, and its decoded nonce must agree with `eventNonce`. Signature verification is left to the destination contract; the worker does not independently verify it cryptographically.

`burned` means no lookup result exists. `unresolved` means no unique complete match is recorded; inspect `resolution_status` for pending, absent, ambiguous, or failed lookup details. `attested` means the message is ready but its receive is not indexed. `settled` means the matching receive is indexed. Missing destination block coverage can hide a receive that has already happened.

Empty batches allow corrections to remove displaced events. The latest delivery covering a block replaces its earlier event set, including across differently aligned ranges. Cached mappings carry the source block hash and immutable message key; a changed source observation invalidates its earlier mapping and is requeued. Failed lookups advance their check timestamp so they cannot starve later transactions.

Replacement and failure behavior was tested with synthetic fixtures, not an induced live reorg or sustained provider outage. The example is scoped to Base/Arc USDC and CCTP V2; other assets, domains, and future message versions need explicit support.

Run `npm test` for the message-matching regressions, including mixed Circle responses. These tests use synthetic fixtures and need no database or `.env`.
