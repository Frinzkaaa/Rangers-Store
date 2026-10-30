import assert from 'node:assert';
import {
  calculateCartTotals,
  calculateChange,
  validateCartBeforeCheckout,
  CartItem,
} from '../src/lib/cart';

console.log('Running pos-cart.test.ts...');

// 1. Calculate cart total: 3 items of 35k + 2 items of 50k = 105k + 100k = 205k
const items: CartItem[] = [
  { harga_satuan: 35000, qty: 3, label: 'Baju / Kemeja' },
  { harga_satuan: 50000, qty: 2, label: 'Crewneck / Celana' },
];

const totals = calculateCartTotals(items, 5000); // 5k discount
assert.strictEqual(totals.subtotal, 205000, 'Subtotal should be 205.000');
assert.strictEqual(totals.diskon, 5000, 'Discount should be 5.000');
assert.strictEqual(totals.total, 200000, 'Total should be 200.000');
assert.strictEqual(totals.total_pcs, 5, 'Total pcs should be 5');

// 2. Validate empty cart:
const emptyValidation = validateCartBeforeCheckout([], 0);
assert.strictEqual(emptyValidation.valid, false, 'Empty cart should be invalid');

// 3. Validate negative total after excessive discount:
const invalidDiscount = validateCartBeforeCheckout(items, 250000);
assert.strictEqual(invalidDiscount.valid, false, 'Discount larger than subtotal should be invalid');

// 4. Validate cash change calculation:
// Total: 200.000, Cash received: 250.000 -> Change: 50.000
const change = calculateChange(200000, 250000);
assert.strictEqual(change.kembalian, 50000, 'Change should be 50.000');
assert.strictEqual(change.isEnough, true, 'Cash received is enough');

// Insufficient cash:
const notEnough = calculateChange(200000, 150000);
assert.strictEqual(notEnough.kembalian, -50000, 'Shortage is -50.000');
assert.strictEqual(notEnough.isEnough, false, 'Cash is not enough');

console.log('✅ pos-cart.test.ts passed!');
