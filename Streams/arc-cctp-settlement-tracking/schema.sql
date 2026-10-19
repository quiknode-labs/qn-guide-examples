CREATE TABLE cctp_batches (
  from_block_number bigint NOT NULL,
  to_block_number bigint NOT NULL,
  network text NOT NULL CHECK (network IN ('arc-mainnet','base-mainnet')),
  stream_id uuid NOT NULL,
  data jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (from_block_number,to_block_number,network),
  CHECK (from_block_number <= to_block_number),
  CHECK ((data->>'filter_version'='4.0.0') IS TRUE),
  CHECK ((data->>'network'=network) IS TRUE),
  CHECK ((jsonb_typeof(data->'legs')='array') IS TRUE)
);

CREATE FUNCTION cctp_touch_batch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.received_at := clock_timestamp();
  RETURN NEW;
END $$;
CREATE TRIGGER cctp_batch_received BEFORE INSERT OR UPDATE ON cctp_batches
FOR EACH ROW EXECUTE FUNCTION cctp_touch_batch();
CREATE INDEX cctp_batches_coverage ON cctp_batches (network,from_block_number,to_block_number);
CREATE INDEX cctp_batches_range ON cctp_batches USING gist
  (int8range(from_block_number,to_block_number,'[]'));

-- The latest delivery covering a block replaces its earlier event set, even
-- when the newer batch has no CCTP events or uses different range boundaries.
CREATE VIEW cctp_legs WITH (security_invoker=true) AS
SELECT DISTINCT ON (leg->>'canonical_id')
  leg->>'canonical_id' AS canonical_id,
  leg->>'side' AS side,
  b.network,
  (leg->>'source_domain')::integer AS source_domain,
  (leg->>'destination_domain')::integer AS destination_domain,
  leg->>'transaction_hash' AS transaction_hash,
  (leg->>'log_index')::bigint AS log_index,
  (leg->>'block_number')::bigint AS block_number,
  (leg->>'block_timestamp')::timestamptz AS block_timestamp,
  leg->>'nonce' AS nonce,
  leg->>'message_key' AS message_key,
  (leg->>'amount_raw')::numeric(78,0) AS amount_raw,
  (leg->>'fee_raw')::numeric(78,0) AS fee_raw,
  (leg->>'net_amount_raw')::numeric(78,0) AS net_amount_raw,
  leg,
  leg->>'block_hash' AS block_hash
FROM cctp_batches AS b
CROSS JOIN LATERAL jsonb_array_elements(b.data->'legs') AS leg
WHERE b.data->>'filter_version'='4.0.0'
  AND b.data->>'network'=b.network
  AND leg->>'network'=b.network
  AND (leg->>'block_number')::bigint BETWEEN b.from_block_number AND b.to_block_number
  AND NOT EXISTS (
    SELECT 1 FROM cctp_batches AS newer
    WHERE newer.network=b.network
      AND int8range(newer.from_block_number,newer.to_block_number,'[]') @> (leg->>'block_number')::bigint
      AND newer.received_at > b.received_at
  )
ORDER BY leg->>'canonical_id',b.received_at DESC;

CREATE TABLE cctp_attestations (
  canonical_id text PRIMARY KEY,
  message_key text NOT NULL,
  block_hash text NOT NULL,
  nonce text,
  iris_status text NOT NULL,
  has_attestation boolean NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (nonce IS NULL OR nonce ~ '^0x[0-9a-f]{64}$')
);

CREATE VIEW cctp_settlements WITH (security_invoker=true) AS
SELECT burn.canonical_id,burn.source_domain,burn.destination_domain,
  burn.transaction_hash AS burn_transaction_hash,
  receive.transaction_hash AS receive_transaction_hash,
  a.nonce,a.iris_status AS resolution_status,
  burn.amount_raw,burn.amount_raw/1000000 AS amount_usdc,
  receive.fee_raw,receive.net_amount_raw,
  receive.net_amount_raw/1000000 AS received_usdc,
  burn.block_timestamp AS burned_at,receive.block_timestamp AS settled_at,
  extract(epoch FROM receive.block_timestamp-burn.block_timestamp)::bigint AS settle_seconds,
  CASE
    WHEN receive.nonce IS NOT NULL THEN 'settled'
    WHEN a.has_attestation THEN 'attested'
    WHEN a.canonical_id IS NOT NULL THEN 'unresolved'
    ELSE 'burned'
  END AS status
FROM cctp_legs AS burn
LEFT JOIN cctp_attestations AS a
  ON a.canonical_id=burn.canonical_id
 AND a.message_key=burn.message_key AND a.block_hash=burn.block_hash
LEFT JOIN cctp_legs AS receive
  ON receive.side='receive'
 AND receive.nonce=a.nonce
 AND receive.source_domain=burn.source_domain
 AND receive.destination_domain=burn.destination_domain
WHERE burn.side='burn';

ALTER TABLE cctp_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cctp_attestations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cctp_batches,cctp_attestations,cctp_legs,cctp_settlements FROM PUBLIC;
DO $$
DECLARE role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
      EXECUTE format('REVOKE ALL ON cctp_batches,cctp_attestations,cctp_legs,cctp_settlements FROM %I',role_name);
    END IF;
  END LOOP;
END $$;
