#!/usr/bin/env node
/**
 * Decode X-PAYMENT header to see what's inside
 *
 * Usage:
 *   npx tsx decode_payment.ts <X-PAYMENT-HEADER-VALUE>
 *
 * Or with ts-node:
 *   npx ts-node decode_payment.ts <X-PAYMENT-HEADER-VALUE>
 *
 * Example:
 *   npx tsx decode_payment.ts "eyJ4NDAyVmVyc2lvbiI..."
 */

const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Usage: npx tsx decode_payment.ts <X-PAYMENT-HEADER-VALUE>');
  console.log('\nExample:');
  console.log('  npx tsx decode_payment.ts "eyJ4NDAyVmVyc2lvbiI..."');
  process.exit(1);
}

const paymentHeader = args[0];

try {
  // Decode from base64
  const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
  const paymentData = JSON.parse(decoded);

  console.log('=== Decoded X-PAYMENT Header ===\n');
  console.log(JSON.stringify(paymentData, null, 2));

  // Extract key info
  console.log('\n=== Key Information ===');
  if (paymentData.payload?.authorization) {
    const auth = paymentData.payload.authorization;
    console.log(`Payer:         ${auth.payer || 'N/A'}`);
    console.log(`Payee:         ${auth.payee || 'N/A'}`);
    console.log(`Amount:        ${auth.amount || 'N/A'} (atomic units)`);
    console.log(`Nonce:         ${auth.nonce || 'N/A'}`);
    console.log(`Valid Until:   ${auth.validUntil || 'N/A'} (Unix timestamp)`);
    console.log(`Resource:      ${auth.resource || 'N/A'}`);
    console.log(`Signature:     ${auth.signature ? auth.signature.slice(0, 20) + '...' : 'N/A'}`);
  }

  if (paymentData.payload?.requirements) {
    const req = paymentData.payload.requirements;
    console.log(`\nNetwork:       ${req.network || 'N/A'}`);
    console.log(`Asset:         ${req.asset || 'N/A'}`);
    console.log(`Description:   ${req.description || 'N/A'}`);
  }

  console.log('\nNote: The payment header contains both the signed authorization');
  console.log('and the payment requirements for verification by the server.');
} catch (error) {
  console.error('Error decoding payment header:', error);
  process.exit(1);
}
