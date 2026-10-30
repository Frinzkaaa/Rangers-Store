import assert from 'node:assert';
import {
  calcBatchUnitCost,
  calcAmortizedRent,
  calcNetProfit,
  formatRupiah,
} from '../src/lib/calc';

console.log('Running calc.test.ts...');

// 1. Batch unit cost: (hargaBeli + ongkir) / jumlahItem
const unitCost = calcBatchUnitCost(1500000, 100000, 100);
assert.strictEqual(unitCost, 16000, 'Batch unit cost should be Rp 16.000');

// Edge case: zero item
const zeroUnitCost = calcBatchUnitCost(1000000, 50000, 0);
assert.strictEqual(zeroUnitCost, 0, 'Zero items should yield 0 unit cost without divide-by-zero');

// 2. Amortized rent calculation:
// Monthly rent 1.500.000 for 7 days -> (1.500.000 / 30) * 7 = 350.000
const rent7Days = calcAmortizedRent(1500000, 'bulanan', 7);
assert.strictEqual(rent7Days, 350000, 'Monthly rent for 7 days should be 350.000');

// Daily rent 50.000 for 3 days -> 150.000
const rentDaily = calcAmortizedRent(50000, 'harian', 3);
assert.strictEqual(rentDaily, 150000, 'Daily rent for 3 days should be 150.000');

// 3. Net profit: omzet - cogs - rentCost - transportCost
// Omzet: 2.000.000, COGS: 800.000, Rent: 350.000, Transport: 150.000 -> 700.000
const netProfit = calcNetProfit(2000000, 800000, 350000, 150000);
assert.strictEqual(netProfit, 700000, 'Net profit should be 700.000');

// 4. Currency formatting: Rp 150.000
const formatted = formatRupiah(150000);
assert.strictEqual(formatted, 'Rp 150.000', 'Should format 150000 as Rp 150.000');

console.log('✅ calc.test.ts passed!');
