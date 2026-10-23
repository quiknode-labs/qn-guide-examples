-- Fresh install. For an existing table, apply migration-event-identity.sql instead.
CREATE TABLE public.liquidations (
    id SERIAL PRIMARY KEY,
    liquidator_address character varying(42) NOT NULL,
    liquidated_wallet character varying(42) NOT NULL,
    collateral_asset character varying(42) NOT NULL,
    collateral_asset_name character varying(100),
    collateral_asset_symbol character varying(20),
    collateral_asset_price numeric(20,6),
    collateral_seized_amount numeric(78,18),
    debt_asset character varying(42) NOT NULL,
    debt_asset_name character varying(100),
    debt_asset_symbol character varying(20),
    debt_asset_price numeric(20,6),
    debt_repaid_amount numeric(78,18),
    transaction_hash character varying(66) NOT NULL,
    block_number bigint NOT NULL,
    block_hash character varying(66) NOT NULL,
    log_index integer NOT NULL CHECK (log_index >= 0),
    receive_a_token boolean NOT NULL,
    timestamp timestamp without time zone NOT NULL,
    UNIQUE (transaction_hash, log_index)
);

ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.liquidations FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.liquidations_id_seq FROM anon, authenticated;
GRANT SELECT ON public.liquidations TO anon, authenticated;
CREATE POLICY "Public dashboard reads" ON public.liquidations
    FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT, INSERT, UPDATE ON public.liquidations TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.liquidations_id_seq TO service_role;
