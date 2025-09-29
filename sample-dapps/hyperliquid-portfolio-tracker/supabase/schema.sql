-- Minimal Clearinghouse Dashboard Schema
-- No user management, no authentication, just data storage

-- Create clearinghouse_states table for main account data
CREATE TABLE clearinghouse_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,

  -- Margin summary
  account_value DECIMAL(20, 5),
  total_margin_used DECIMAL(20, 5),
  withdrawable DECIMAL(20, 5),

  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset_positions table for individual position data
CREATE TABLE asset_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,

  coin TEXT NOT NULL,
  size DECIMAL(20, 5) NOT NULL,
  leverage_type TEXT NOT NULL, -- cross, isolated
  leverage_value INTEGER NOT NULL,

  entry_price DECIMAL(20, 5),
  position_value DECIMAL(20, 5),
  unrealized_pnl DECIMAL(20, 5),
  liquidation_price DECIMAL(20, 5),
  margin_used DECIMAL(20, 5),

  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_rate_limits table for rate limiting information
CREATE TABLE user_rate_limits (
  user_address TEXT NOT NULL,

  -- Rate limit data
  cum_vlm DECIMAL(20, 5) NOT NULL, -- Cumulative volume

  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_vault_equities table for vault equity information
CREATE TABLE user_vault_equities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,

  -- Vault equity data
  vault_address TEXT NOT NULL, -- Ethereum address of the vault
  equity DECIMAL(20, 5) NOT NULL, -- Amount of equity locked in the vault
  locked_until_timestamp BIGINT NOT NULL, -- Timestamp in milliseconds until equity is locked

  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spot_balances table for spot asset balance information
CREATE TABLE spot_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,

  -- Spot balance data
  coin TEXT NOT NULL, -- Symbol of the asset (e.g., USDC, BTC, ETH, CAT)
  token INTEGER NOT NULL, -- Internal token index identifier for the asset
  total DECIMAL(20, 3) NOT NULL, -- Total balance of the asset in the account
  entry_ntl DECIMAL(20, 3) NOT NULL, -- Entry notional value of the asset position in USD terms

  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicate token entries per user
  UNIQUE (user_address, token)
);

-- Create delegations table for user delegation information
CREATE TABLE delegations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,

  -- Delegation data
  validator TEXT NOT NULL, -- Address of the validator receiving the delegation
  amount DECIMAL(20, 5) NOT NULL, -- Amount of tokens delegated
  locked_until_timestamp BIGINT NOT NULL, -- Timestamp until which delegation remains locked

  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicate validator entries per user
  UNIQUE (user_address, validator)
);

-- Create indexes for efficient querying
CREATE INDEX idx_clearinghouse_states_wallet_address ON clearinghouse_states(wallet_address);
CREATE INDEX idx_clearinghouse_states_timestamp ON clearinghouse_states(timestamp);
CREATE INDEX idx_clearinghouse_states_created_at ON clearinghouse_states(created_at);

CREATE INDEX idx_asset_positions_wallet_address ON asset_positions(wallet_address);
CREATE INDEX idx_asset_positions_coin ON asset_positions(coin);
CREATE INDEX idx_asset_positions_timestamp ON asset_positions(timestamp);

CREATE INDEX idx_user_rate_limits_user_address ON user_rate_limits(user_address);
CREATE INDEX idx_user_rate_limits_timestamp ON user_rate_limits(timestamp);
CREATE INDEX idx_user_rate_limits_created_at ON user_rate_limits(created_at);

CREATE INDEX idx_user_vault_equities_user_address ON user_vault_equities(user_address);
CREATE INDEX idx_user_vault_equities_vault_address ON user_vault_equities(vault_address);
CREATE INDEX idx_user_vault_equities_timestamp ON user_vault_equities(timestamp);
CREATE INDEX idx_user_vault_equities_created_at ON user_vault_equities(created_at);

CREATE INDEX idx_spot_balances_user_address ON spot_balances(user_address);
CREATE INDEX idx_spot_balances_coin ON spot_balances(coin);
CREATE INDEX idx_spot_balances_token ON spot_balances(token);
CREATE INDEX idx_spot_balances_timestamp ON spot_balances(timestamp);
CREATE INDEX idx_spot_balances_created_at ON spot_balances(created_at);

CREATE INDEX idx_delegations_user_address ON delegations(user_address);
CREATE INDEX idx_delegations_timestamp ON delegations(timestamp);
CREATE INDEX idx_delegations_created_at ON delegations(created_at);

-- Create wallet_switch_requests table for communication between dashboard and indexer
CREATE TABLE wallet_switch_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallet_switch_requests_status ON wallet_switch_requests(status);
CREATE INDEX idx_wallet_switch_requests_created_at ON wallet_switch_requests(created_at);

-- Add unique constraints to prevent duplicate entries
ALTER TABLE asset_positions ADD CONSTRAINT unique_position_per_wallet
UNIQUE (wallet_address, coin);

ALTER TABLE user_vault_equities ADD CONSTRAINT unique_vault_per_user
UNIQUE (user_address, vault_address);

ALTER TABLE spot_balances ADD CONSTRAINT unique_spot_per_user
UNIQUE (user_address, token);

ALTER TABLE user_rate_limits ADD CONSTRAINT unique_user_rate_limit
UNIQUE (user_address);

-- Create atomic replace positions function to prevent UI flicker
create or replace function replace_asset_positions(
  p_wallet_address text,
  p_positions jsonb
)
returns void
language plpgsql
as $$
begin
  -- Start transaction (implicit in function)
  -- Delete existing positions for this wallet
  delete from asset_positions where wallet_address = p_wallet_address;

  -- Insert new positions if any exist
  if jsonb_array_length(p_positions) > 0 then
    insert into asset_positions (
      wallet_address,
      coin,
      size,
      leverage_type,
      leverage_value,
      entry_price,
      position_value,
      unrealized_pnl,
      liquidation_price,
      margin_used,
      timestamp
    )
    select
      pos->>'wallet_address',
      pos->>'coin',
      (pos->>'size')::numeric,
      pos->>'leverage_type',
      (pos->>'leverage_value')::integer,
      (pos->>'entry_price')::numeric,
      (pos->>'position_value')::numeric,
      (pos->>'unrealized_pnl')::numeric,
      (pos->>'liquidation_price')::numeric,
      (pos->>'margin_used')::numeric,
      (pos->>'timestamp')::bigint
    from jsonb_array_elements(p_positions) as pos;
  end if;

  -- Transaction commits automatically on function success
end;
$$;