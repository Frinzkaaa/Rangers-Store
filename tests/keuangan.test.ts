import assert from 'node:assert';
import {
  getFinancialSummary,
  createExpense,
  getExpenses,
} from '../src/lib/db';

console.log('Running keuangan.test.ts...');

async function run() {
  // 1. Create operational expense:
  const newExp = await createExpense({
    jenis: 'transportasi',
    deskripsi: 'Bensin & Tol Loading Bazar Sarinah',
    nominal: 75000,
    periode: 'sekali',
    tanggal_mulai: new Date().toISOString().split('T')[0],
  });

  assert.strictEqual(newExp.nominal, 75000, 'Expense nominal should be 75.000');
  assert.strictEqual(newExp.jenis, 'transportasi', 'Expense jenis should be transportasi');

  // 2. Fetch all expenses:
  const expenses = await getExpenses();
  assert.ok(expenses.length >= 1, 'Should have at least 1 expense');

  // 3. Test financial aggregation:
  const summary = await getFinancialSummary();
  assert.ok(summary.totalOmzet >= 0, 'Total omzet should be >= 0');
  assert.ok(summary.totalPcs >= 0, 'Total pcs should be >= 0');
  assert.ok(summary.totalTransaksi >= 0, 'Total transaksi should be >= 0');
  assert.strictEqual(summary.labaKotor, summary.totalOmzet - summary.totalCogs, 'Gross profit = omzet - cogs');
  assert.strictEqual(summary.labaBersih, summary.labaKotor - summary.totalOperasional, 'Net profit = gross profit - operational costs');

  console.log('✅ keuangan.test.ts passed!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
