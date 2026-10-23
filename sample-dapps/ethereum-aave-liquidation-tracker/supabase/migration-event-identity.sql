-- Pause the Stream and back up the table before applying this additive migration.
-- Older rows remain NULL: their log identity cannot be reconstructed from tx hash alone.
BEGIN;
ALTER TABLE public.liquidations
    ADD COLUMN IF NOT EXISTS block_hash character varying(66),
    ADD COLUMN IF NOT EXISTS log_index integer CHECK (log_index >= 0);
CREATE UNIQUE INDEX IF NOT EXISTS liquidations_event_identity
    ON public.liquidations (transaction_hash, log_index);
ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.liquidations FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.liquidations_id_seq FROM anon, authenticated;
GRANT SELECT ON public.liquidations TO anon, authenticated;
DROP POLICY IF EXISTS "Public dashboard reads" ON public.liquidations;
CREATE POLICY "Public dashboard reads" ON public.liquidations
    FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT, INSERT, UPDATE ON public.liquidations TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.liquidations_id_seq TO service_role;
COMMIT;
