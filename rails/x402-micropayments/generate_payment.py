#!/usr/bin/env python3
"""Generate a valid X-PAYMENT header for testing the Rails app"""

import os
from eth_account import Account
from x402.exact import prepare_payment_header, sign_payment_header
from x402.types import PaymentRequirements

# Configuration
PRIVATE_KEY = os.environ.get("X402_TEST_PRIVATE_KEY", "YourPrivateKeyHere")
PORT = os.environ.get("PORT", "3000")
PAY_TO = os.environ.get("X402_WALLET_ADDRESS", "0xd086Ef8F2c0F9d642120cCf0898BD101b1d18Db6")

# Create account from private key
account = Account.from_key(PRIVATE_KEY)

print(f"Using test account: {account.address}")
print(f"Port: {PORT}")
print()

# Payment requirements (matching what the Rails app expects)
requirements = PaymentRequirements(
    scheme="exact",
    network="base-sepolia",
    asset="0x036CbD53842c5426634e7929541eC2318f3dCF7e",  # USDC on base-sepolia
    pay_to=PAY_TO,
    max_amount_required="1000",  # $0.001 in atomic units
    resource=f"http://localhost:{PORT}/api/weather/paywalled_info",
    description="Payment required for /api/weather/paywalled_info",
    max_timeout_seconds=600,
    mime_type="application/json",
    output_schema=None,
    extra={
        "name": "USDC",  # base-sepolia uses "USDC" not "USD Coin"
        "version": "2",
    },
)

# Generate unsigned payment header
unsigned_header = prepare_payment_header(account.address, 1, requirements)

# Convert nonce to hex string for signing (required by sign_payment_header)
nonce = unsigned_header["payload"]["authorization"]["nonce"]
unsigned_header["payload"]["authorization"]["nonce"] = nonce.hex()

# Sign the payment header
payment_header = sign_payment_header(account, requirements, unsigned_header)

print("\nPayment Header (X-PAYMENT):")
print(payment_header)

print("\n\nCurl command:")
print(
    f'curl -i -H "X-PAYMENT: {payment_header}" http://localhost:{PORT}/api/weather/paywalled_info'
)
