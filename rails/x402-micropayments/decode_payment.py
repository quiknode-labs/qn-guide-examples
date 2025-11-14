#!/usr/bin/env python3
"""Decode X-PAYMENT header to see what's inside"""

import sys
import base64
import json

if len(sys.argv) < 2:
    print("Usage: python decode_payment.py <X-PAYMENT-HEADER-VALUE>")
    print("\nExample:")
    print('  python decode_payment.py "eyJ4NDAyVmVyc2lvbiI..."')
    sys.exit(1)

payment_header = sys.argv[1]

try:
    decoded = base64.b64decode(payment_header)
    payment_data = json.loads(decoded)

    print("=== Decoded X-PAYMENT Header ===\n")
    print(json.dumps(payment_data, indent=2))

    # Extract key info
    print("\n=== Key Information ===")
    if "payload" in payment_data and "authorization" in payment_data["payload"]:
        auth = payment_data["payload"]["authorization"]
        print(f"From (payer):  {auth.get('from', 'N/A')}")
        print(f"To (pay_to):   {auth.get('to', 'N/A')}")
        print(f"Value:         {auth.get('value', 'N/A')} (atomic units)")
        print(f"Network:       {payment_data.get('network', 'N/A')}")

        # The resource URL is NOT in the payment header
        # It's verified by the server against what was originally signed
        print("\nNote: The resource URL and other requirements are verified")
        print("by the server, not included in the payment header.")

except Exception as e:
    print(f"Error decoding payment header: {e}")
    sys.exit(1)
