import assert from 'node:assert';
import { generateReportPdfBuffer } from '../src/lib/pdf';

console.log('Running pdf.test.ts...');

async function run() {
  const dummyReportData = {
    storeName: 'Rangers Store',
    startDate: '2026-10-01',
    endDate: '2026-10-30',
    summary: {
      totalOmzet: 4500000,
      totalPcs: 85,
      totalTransaksi: 32,
      totalCogs: 2125000,
      labaKotor: 2375000,
      totalRentCost: 600000,
      totalTransportCost: 150000,
      totalOtherCost: 0,
      totalOperasional: 750000,
      labaBersih: 1625000,
    },
    transactions: [
      {
        order_id: 'TRX-20261030-001',
        created_at: '2026-10-30T10:00:00Z',
        metode_bayar: 'qris',
        total_pcs: 3,
        total: 100000,
      },
    ],
    batches: [
      {
        nama_batch: 'Bal Crewneck USA #1',
        supplier: 'Pasar Senen',
        modal_per_item: 25000,
        jumlah_item: 100,
        sisa_item: 15,
      },
    ],
  };

  const buffer = await generateReportPdfBuffer(dummyReportData);
  assert.ok(buffer instanceof Uint8Array || Buffer.isBuffer(buffer), 'Buffer should be Uint8Array or Buffer');
  assert.ok(buffer.length > 500, 'PDF buffer size should be > 500 bytes');

  console.log('✅ pdf.test.ts passed! Buffer size:', buffer.length);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
