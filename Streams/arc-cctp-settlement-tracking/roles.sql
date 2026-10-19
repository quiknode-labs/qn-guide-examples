-- Run with psql as the schema owner after setting both password variables.
\getenv writer_password CCTP_WRITER_PASSWORD
\getenv reconciler_password CCTP_RECONCILER_PASSWORD
CREATE ROLE cctp_writer LOGIN PASSWORD :'writer_password';
CREATE ROLE cctp_reconciler LOGIN PASSWORD :'reconciler_password';
GRANT USAGE ON SCHEMA public TO cctp_writer,cctp_reconciler;
GRANT SELECT,INSERT,UPDATE ON cctp_batches TO cctp_writer;
GRANT SELECT ON cctp_batches,cctp_legs,cctp_attestations,cctp_settlements TO cctp_reconciler;
GRANT INSERT,UPDATE ON cctp_attestations TO cctp_reconciler;
CREATE POLICY cctp_writer_batches ON cctp_batches TO cctp_writer USING (true) WITH CHECK (true);
CREATE POLICY cctp_reconciler_batches ON cctp_batches FOR SELECT TO cctp_reconciler USING (true);
CREATE POLICY cctp_reconciler_attestations ON cctp_attestations TO cctp_reconciler USING (true) WITH CHECK (true);
