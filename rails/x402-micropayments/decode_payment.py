#!/usr/bin/env python3
"""Decode PAYMENT-SIGNATURE header to see what's inside"""

import sys
import base64
import json

if len(sys.argv) < 2:
    print("Usage: python decode_payment.py <PAYMENT-SIGNATURE-HEADER-VALUE>")
    print("\nExample:")
    print('  python decode_payment.py "eyJ4NDAyVmVyc2lvbiI..."')
    sys.exit(1)

payment_header = sys.argv[1]

try:
    decoded = base64.b64decode(payment_header)
    payment_data = json.loads(decoded)

    print("=== Decoded PAYMENT-SIGNATURE Header ===\n")
    print(json.dumps(payment_data, indent=2))

    # Extract key info
    print("\n=== Key Information ===")
    if "payload" in payment_data and "authorization" in payment_data["payload"]:
        auth = payment_data["payload"]["authorization"]
        print(f"Payer:         {auth.get('payer', 'N/A')}")
        print(f"Payee:         {auth.get('payee', 'N/A')}")
        print(f"Amount:        {auth.get('amount', 'N/A')} (atomic units)")
        print(f"Nonce:         {auth.get('nonce', 'N/A')}")
        print(f"Valid Until:   {auth.get('validUntil', 'N/A')} (Unix timestamp)")
        print(f"Resource:      {auth.get('resource', 'N/A')}")
        print(
            f"Signature:     {(auth.get('signature') or '')[:20]}..."
            if auth.get("signature")
            else "Signature:     N/A"
        )

    if "payload" in payment_data and "requirements" in payment_data["payload"]:
        req = payment_data["payload"]["requirements"]
        print(f"\nNetwork:       {req.get('network', 'N/A')}")
        print(f"Asset:         {req.get('asset', 'N/A')}")
        print(f"Description:   {req.get('description', 'N/A')}")

    print("\nNote: The payment header contains both the signed authorization")
    print("and the payment requirements for verification by the server.")

except Exception as e:
    print(f"Error decoding payment header: {e}")
    sys.exit(1)
