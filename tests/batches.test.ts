import assert from 'node:assert';
import {
  createBatch,
  getBatches,
  deductBatchStock,
  getActiveAverageHpp,
} from '../src/lib/db';

console.log('Running batches.test.ts...');

async function run() {
  // 1. Create a new batch:
  const newBatch = await createBatch({
    nama_batch: 'Bal Test Sepatu & Aksesoris',
    supplier: 'Supplier Gedebage Bandung',
    harga_beli: 2000000,
    ongkir: 100000,
    jumlah_item: 50,
    catatan: 'Testing batch intake',
  });

  assert.strictEqual(newBatch.modal_per_item, 42000, 'Modal per item should be (2.000.000 + 100.000) / 50 = 42.000');
  assert.strictEqual(newBatch.sisa_item, 50, 'Initial sisa_item should be 50');

  // 2. Fetch all batches:
  const batches = await getBatches();
  assert.ok(batches.length >= 1, 'Batches list should contain at least 1 batch');

  // 3. Deduct stock:
  const initialStock = newBatch.sisa_item;
  await deductBatchStock(5);
  const updatedBatches = await getBatches();
  const found = updatedBatches.find((b) => b.id === newBatch.id);
  assert.strictEqual(found?.sisa_item, initialStock - 5, 'Stock should be deducted by 5');

  // 4. Active average HPP should be positive:
  const avgHpp = await getActiveAverageHpp();
  assert.ok(avgHpp > 0, 'Average HPP should be > 0');

  console.log('✅ batches.test.ts passed!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
