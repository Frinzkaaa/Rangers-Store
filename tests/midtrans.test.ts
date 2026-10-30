import assert from 'node:assert';
import {
  generateOrderId,
  buildQrisChargePayload,
  verifyMidtransSignature,
} from '../src/lib/midtrans';

console.log('Running midtrans.test.ts...');

// 1. Order ID format: TRX-YYYYMMDD-XXXX
const orderId = generateOrderId();
assert.ok(orderId.startsWith('TRX-'), 'Order ID should start with TRX-');
assert.strictEqual(orderId.length >= 16, true, 'Order ID length should be >= 16');

// 2. Build QRIS charge payload:
const payload = buildQrisChargePayload('TRX-20261030-0099', 150000);
assert.strictEqual(payload.payment_type, 'qris', 'Payment type must be qris');
assert.strictEqual(payload.transaction_details.order_id, 'TRX-20261030-0099');
assert.strictEqual(payload.transaction_details.gross_amount, 150000, 'Gross amount must be locked to cart total');
assert.strictEqual(payload.qris.acquirer, 'gopay', 'Acquirer should be gopay');

// 3. Signature verification:
// SHA512(order_id + status_code + gross_amount + ServerKey)
const serverKey = 'SB-Mid-server-TESTKEY123';
const orderIdTest = 'TRX-TEST-001';
const statusCode = '200';
const grossAmount = '150000.00';

import crypto from 'node:crypto';
const expectedSig = crypto
  .createHash('sha512')
  .update(`${orderIdTest}${statusCode}${grossAmount}${serverKey}`)
  .digest('hex');

const isValid = verifyMidtransSignature(orderIdTest, statusCode, grossAmount, expectedSig, serverKey);
assert.strictEqual(isValid, true, 'Signature verification should be valid with matching hash');

const isInvalid = verifyMidtransSignature(orderIdTest, statusCode, grossAmount, 'wronghash', serverKey);
assert.strictEqual(isInvalid, false, 'Signature verification should fail with wrong hash');

console.log('✅ midtrans.test.ts passed!');
