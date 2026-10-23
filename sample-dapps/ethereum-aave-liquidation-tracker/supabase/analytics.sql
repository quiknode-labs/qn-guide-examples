-- get_asset_distributions
CREATE OR REPLACE FUNCTION get_asset_distributions(time_range text)
RETURNS json AS $$
DECLARE
  interval_start timestamp;
BEGIN
  interval_start := CASE time_range
    WHEN '24h' THEN NOW() - INTERVAL '24 hours'
    WHEN '7d' THEN NOW() - INTERVAL '7 days'
    WHEN '30d' THEN NOW() - INTERVAL '30 days'
    WHEN '365d' THEN NOW() - INTERVAL '365 days'
    ELSE NOW() - INTERVAL '30 days'
  END;

  RETURN json_build_object(
    'topCollateralAssets', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          collateral_asset_symbol as symbol,
          COUNT(*) as count,
          SUM(collateral_seized_amount * collateral_asset_price) as totalValueUSD,
          SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as totalProfitUSD,
          (COUNT(*)::float / (SELECT COUNT(*) FROM liquidations WHERE timestamp >= interval_start)::float * 100) as percentageOfTotal
        FROM liquidations
        WHERE timestamp >= interval_start
        GROUP BY collateral_asset_symbol
        ORDER BY count DESC
        LIMIT 5
      ) t
    ),
    'topDebtAssets', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          debt_asset_symbol as symbol,
          COUNT(*) as count,
          SUM(debt_repaid_amount * debt_asset_price) as totalValueUSD,
          SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as totalProfitUSD,
          (COUNT(*)::float / (SELECT COUNT(*) FROM liquidations WHERE timestamp >= interval_start)::float * 100) as percentageOfTotal
        FROM liquidations
        WHERE timestamp >= interval_start
        GROUP BY debt_asset_symbol
        ORDER BY count DESC
        LIMIT 5
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql;

-- get_metrics_overview
CREATE OR REPLACE FUNCTION get_metrics_overview()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'total24h', (
      SELECT json_build_object(
        'count', COUNT(*),
        'valueUSD', COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0),
        'profitUSD', COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0)
      )
      FROM liquidations
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
    ),
    'total7d', (
      SELECT json_build_object(
        'count', COUNT(*),
        'valueUSD', COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0),
        'profitUSD', COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0)
      )
      FROM liquidations
      WHERE timestamp >= NOW() - INTERVAL '7 days'
    ),
    'total30d', (
      SELECT json_build_object(
        'count', COUNT(*),
        'valueUSD', COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0),
        'profitUSD', COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0)
      )
      FROM liquidations
      WHERE timestamp >= NOW() - INTERVAL '30 days'
    ),
    'total365d', (
      SELECT json_build_object(
        'count', COUNT(*),
        'valueUSD', COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0),
        'profitUSD', COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0)
      )
      FROM liquidations
      WHERE timestamp >= NOW() - INTERVAL '365 days'
    ),
    'topLiquidators', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          liquidator_address as address,
          COUNT(*) as count,
          SUM(debt_repaid_amount * debt_asset_price) as totalValueUSD,
          AVG(debt_repaid_amount * debt_asset_price) as avgLiquidationUSD,
          SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as totalProfitUSD,
          AVG((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as avgProfitUSD
        FROM liquidations
        GROUP BY liquidator_address
        ORDER BY totalProfitUSD DESC
        LIMIT 5
      ) t
    ),
    'topLiquidatedUsers', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          liquidated_wallet as address,
          COUNT(*) as count,
          SUM(debt_repaid_amount * debt_asset_price) as totalValueUSD,
          AVG(debt_repaid_amount * debt_asset_price) as avgLiquidationUSD,
          SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as totalLossUSD,
          AVG((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as avgLossUSD
        FROM liquidations
        GROUP BY liquidated_wallet
        ORDER BY count DESC
        LIMIT 5
      ) t
    ),
    'largestLiquidations', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          transaction_hash as txHash,
          timestamp,
          debt_repaid_amount * debt_asset_price as valueUSD,
          (collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price) as profitUSD,
          collateral_asset_symbol as collateralAsset,
          debt_asset_symbol as debtAsset,
          liquidator_address as liquidator,
          liquidated_wallet as liquidatedUser
        FROM liquidations
        ORDER BY debt_repaid_amount * debt_asset_price DESC
        LIMIT 5
      ) t
    ),
    'mostProfitableLiquidations', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          transaction_hash as txHash,
          timestamp,
          debt_repaid_amount * debt_asset_price as valueUSD,
          (collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price) as profitUSD,
          collateral_asset_symbol as collateralAsset,
          debt_asset_symbol as debtAsset,
          liquidator_address as liquidator,
          liquidated_wallet as liquidatedUser
        FROM liquidations
        ORDER BY ((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) DESC
        LIMIT 5
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql;

-- get_liquidation_trends
CREATE OR REPLACE FUNCTION get_liquidation_trends(time_range text)
RETURNS json AS $$
DECLARE
  interval_start timestamp;
  grouping_interval text;
BEGIN
  SELECT
    CASE time_range
      WHEN '24h' THEN NOW() - INTERVAL '24 hours'
      WHEN '7d' THEN NOW() - INTERVAL '7 days'
      WHEN '30d' THEN NOW() - INTERVAL '30 days'
      WHEN '365d' THEN NOW() - INTERVAL '365 days'
      ELSE NOW() - INTERVAL '30 days'
    END,
    CASE time_range
      WHEN '24h' THEN 'hour'
      WHEN '7d' THEN 'day'
      WHEN '30d' THEN 'day'
      WHEN '365d' THEN 'month'
      ELSE 'day'
    END
  INTO interval_start, grouping_interval;

  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        date_trunc(grouping_interval, timestamp) as date,
        COUNT(*) as count,
        COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0) as totalValueUSD,
        COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0) as totalProfitUSD
      FROM liquidations
      WHERE timestamp >= interval_start
      GROUP BY date_trunc(grouping_interval, timestamp)
      ORDER BY date_trunc(grouping_interval, timestamp)
    ) t
  );
END;
$$ LANGUAGE plpgsql;

CREATE INDEX IF NOT EXISTS idx_debt_asset ON liquidations(debt_asset_symbol text_ops);
CREATE INDEX IF NOT EXISTS idx_timestamp ON liquidations(timestamp timestamp_ops);
CREATE INDEX IF NOT EXISTS idx_liquidator_address ON liquidations(liquidator_address text_ops);
CREATE INDEX IF NOT EXISTS idx_liquidated_wallet ON liquidations(liquidated_wallet text_ops);
CREATE INDEX IF NOT EXISTS idx_collateral_asset ON liquidations(collateral_asset_symbol text_ops);
CREATE INDEX IF NOT EXISTS idx_liquidations_assets ON liquidations(collateral_asset_symbol text_ops,debt_asset_symbol text_ops);
