import assert from 'node:assert';
import {
  generateOrderId,
  buildQrisChargePayload,
  buildVaChargePayload,
  getBankSimulatorUrl,
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

// 3. Build VA charge payload for BCA:
const bcaPayload = buildVaChargePayload('TRX-20261030-0100', 75000, 'bca');
assert.strictEqual(bcaPayload.payment_type, 'bank_transfer');
assert.strictEqual((bcaPayload as any).bank_transfer.bank, 'bca');
assert.strictEqual(bcaPayload.transaction_details.gross_amount, 75000);

// 4. Build VA charge payload for Mandiri (echannel):
const mandiriPayload = buildVaChargePayload('TRX-20261030-0101', 120000, 'mandiri');
assert.strictEqual(mandiriPayload.payment_type, 'echannel');
assert.strictEqual((mandiriPayload as any).echannel.bill_info1, 'Pembayaran:');
assert.strictEqual((mandiriPayload as any).echannel.bill_info2, 'Rangers Store');

// 5. Build VA charge payload for BNI & BRI:
const bniPayload = buildVaChargePayload('TRX-20261030-0102', 80000, 'bni');
assert.strictEqual((bniPayload as any).bank_transfer.bank, 'bni');
const briPayload = buildVaChargePayload('TRX-20261030-0103', 90000, 'bri');
assert.strictEqual((briPayload as any).bank_transfer.bank, 'bri');

// 6. Simulator URLs:
assert.ok(getBankSimulatorUrl('bca').includes('bca'), 'BCA simulator url should contain bca');
assert.ok(getBankSimulatorUrl('mandiri').includes('mandiri'), 'Mandiri simulator url should contain mandiri');

// 7. Signature verification:
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

