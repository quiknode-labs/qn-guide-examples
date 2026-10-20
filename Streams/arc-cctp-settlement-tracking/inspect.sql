SELECT source_domain,destination_domain,status,
       burn_transaction_hash,receive_transaction_hash,
       round(amount_usdc,6) AS burned_usdc,
       round(fee_raw/1000000,6) AS fee_usdc,
       round(received_usdc,6) AS received_usdc,
       settle_seconds
FROM cctp_settlements
ORDER BY source_domain,burn_transaction_hash;
