import { neon } from '@neondatabase/serverless';
import { DEFAULT_PRICE_PRESETS } from './constants';
import { calcBatchUnitCost, calcAmortizedRent, calcNetProfit } from './calc';

export interface Batch {
  id: number;
  nama_batch: string;
  supplier: string;
  harga_beli: number;
  ongkir: number;
  jumlah_item: number;
  modal_per_item: number;
  sisa_item: number;
  catatan?: string;
  created_at: string;
}

export interface TransactionItem {
  id?: number;
  harga_satuan: number;
  qty: number;
  subtotal: number;
  modal_satuan_tercatat: number;
}

export interface Transaction {
  id: number;
  order_id: string;
  metode_bayar: 'qris' | 'tunai';
  subtotal: number;
  diskon: number;
  total: number;
  total_pcs: number;
  status_pembayaran: 'pending' | 'settlement' | 'expire' | 'cancel';
  midtrans_transaction_id?: string;
  midtrans_qr_url?: string;
  created_at: string;
  items?: TransactionItem[];
}

export interface Expense {
  id: number;
  jenis: 'sewa_tempat' | 'transportasi' | 'lainnya';
  deskripsi: string;
  nominal: number;
  periode: 'harian' | 'bulanan' | '3_bulan' | '6_bulan' | 'tahunan' | 'sekali';
  tanggal_mulai: string;
  tanggal_selesai?: string;
  created_at: string;
}

export interface PricePreset {
  id: number;
  nominal: number;
  label: string;
  urutan: number;
}

// In-Memory store fallback when DATABASE_URL is not set
class MemoryStore {
  batches: Batch[] = [
    {
      id: 1,
      nama_batch: 'Bal Crewneck & Kaos USA Nov #1',
      supplier: 'Pasar Senen Block III (Pak Hendra)',
      harga_beli: 3500000,
      ongkir: 150000,
      jumlah_item: 120,
      modal_per_item: Math.round((3500000 + 150000) / 120), // Rp 30.417
      sisa_item: 114,
      catatan: 'Sortir grade A 40 pcs, grade B 80 pcs',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 2,
      nama_batch: 'Bal Jaket Vintage & Windbreaker Japan',
      supplier: 'Supplier Bandung Import',
      harga_beli: 4200000,
      ongkir: 200000,
      jumlah_item: 80,
      modal_per_item: Math.round((4200000 + 200000) / 80), // Rp 55.000
      sisa_item: 78,
      catatan: 'Jaket outdoor 90s, kualitas prima',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ];

  transactions: Transaction[] = [
    {
      id: 1,
      order_id: 'TRX-20261030-001',
      metode_bayar: 'qris',
      subtotal: 105000,
      diskon: 5000,
      total: 100000,
      total_pcs: 3,
      status_pembayaran: 'settlement',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      items: [
        { harga_satuan: 35000, qty: 3, subtotal: 105000, modal_satuan_tercatat: 30417 },
      ],
    },
    {
      id: 2,
      order_id: 'TRX-20261030-002',
      metode_bayar: 'tunai',
      subtotal: 150000,
      diskon: 0,
      total: 150000,
      total_pcs: 2,
      status_pembayaran: 'settlement',
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      items: [
        { harga_satuan: 75000, qty: 2, subtotal: 150000, modal_satuan_tercatat: 30417 },
      ],
    },
    {
      id: 3,
      order_id: 'TRX-20261030-003',
      metode_bayar: 'qris',
      subtotal: 100000,
      diskon: 0,
      total: 100000,
      total_pcs: 1,
      status_pembayaran: 'settlement',
      created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
      items: [
        { harga_satuan: 100000, qty: 1, subtotal: 100000, modal_satuan_tercatat: 55000 },
      ],
    },
  ];

  expenses: Expense[] = [
    {
      id: 1,
      jenis: 'sewa_tempat',
      deskripsi: 'Sewa Booth Lapak Mall Lantai UG',
      nominal: 2400000,
      periode: 'bulanan',
      tanggal_mulai: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 2,
      jenis: 'transportasi',
      deskripsi: 'Sewa Mobil Pick-up Loading Barang Bazar',
      nominal: 150000,
      periode: 'sekali',
      tanggal_mulai: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
  ];

  pricePresets: PricePreset[] = DEFAULT_PRICE_PRESETS.map((p, idx) => ({
    id: idx + 1,
    nominal: p.nominal,
    label: p.label,
    urutan: idx + 1,
  }));
}

const memoryStore = new MemoryStore();

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));
}

export function getNeonSql() {
  if (hasDatabaseUrl()) {
    return neon(process.env.DATABASE_URL!);
  }
  return null;
}

// 1. Batches API
export async function getBatches(): Promise<Batch[]> {
  const sql = getNeonSql();
  if (sql) {
    const rows = await sql`SELECT * FROM batches ORDER BY created_at DESC;`;
    return rows as Batch[];
  }
  return [...memoryStore.batches].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createBatch(data: Omit<Batch, 'id' | 'modal_per_item' | 'sisa_item' | 'created_at'>): Promise<Batch> {
  const modal_per_item = calcBatchUnitCost(data.harga_beli, data.ongkir, data.jumlah_item);
  const sisa_item = data.jumlah_item;
  const sql = getNeonSql();

  if (sql) {
    const rows = await sql`
      INSERT INTO batches (nama_batch, supplier, harga_beli, ongkir, jumlah_item, modal_per_item, sisa_item, catatan)
      VALUES (${data.nama_batch}, ${data.supplier}, ${data.harga_beli}, ${data.ongkir}, ${data.jumlah_item}, ${modal_per_item}, ${sisa_item}, ${data.catatan || ''})
      RETURNING *;
    `;
    return rows[0] as Batch;
  }

  const newBatch: Batch = {
    id: memoryStore.batches.length + 1,
    ...data,
    modal_per_item,
    sisa_item,
    created_at: new Date().toISOString(),
  };
  memoryStore.batches.unshift(newBatch);
  return newBatch;
}

export async function getActiveAverageHpp(): Promise<number> {
  const batches = await getBatches();
  const availableBatches = batches.filter((b) => b.sisa_item > 0);
  if (!availableBatches.length) {
    if (batches.length) return batches[0].modal_per_item;
    return 0;
  }
  // Weighted average cost based on remaining items
  const totalStock = availableBatches.reduce((acc, b) => acc + b.sisa_item, 0);
  const totalValuation = availableBatches.reduce((acc, b) => acc + b.modal_per_item * b.sisa_item, 0);
  return totalStock > 0 ? Math.round(totalValuation / totalStock) : 0;
}

export async function deductBatchStock(totalPcs: number): Promise<void> {
  const batches = await getBatches();
  let remainingToDeduct = totalPcs;

  for (const batch of batches) {
    if (remainingToDeduct <= 0) break;
    if (batch.sisa_item > 0) {
      const take = Math.min(batch.sisa_item, remainingToDeduct);
      batch.sisa_item -= take;
      remainingToDeduct -= take;

      const sql = getNeonSql();
      if (sql) {
        await sql`UPDATE batches SET sisa_item = ${batch.sisa_item} WHERE id = ${batch.id};`;
      }
    }
  }
}

// 2. Transactions API
export async function getTransactions(): Promise<Transaction[]> {
  const sql = getNeonSql();
  if (sql) {
    const rows = await sql`SELECT * FROM transactions ORDER BY created_at DESC;`;
    return rows as Transaction[];
  }
  return [...memoryStore.transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createTransaction(data: {
  order_id: string;
  metode_bayar: 'qris' | 'tunai';
  subtotal: number;
  diskon: number;
  total: number;
  total_pcs: number;
  status_pembayaran: 'pending' | 'settlement';
  midtrans_transaction_id?: string;
  midtrans_qr_url?: string;
  items: Array<{ harga_satuan: number; qty: number; subtotal: number }>;
}): Promise<Transaction> {
  const defaultHpp = await getActiveAverageHpp();
  const sql = getNeonSql();

  const itemsWithHpp: TransactionItem[] = data.items.map((it) => ({
    ...it,
    modal_satuan_tercatat: defaultHpp,
  }));

  if (sql) {
    const rows = await sql`
      INSERT INTO transactions (order_id, metode_bayar, subtotal, diskon, total, total_pcs, status_pembayaran, midtrans_transaction_id, midtrans_qr_url)
      VALUES (${data.order_id}, ${data.metode_bayar}, ${data.subtotal}, ${data.diskon}, ${data.total}, ${data.total_pcs}, ${data.status_pembayaran}, ${data.midtrans_transaction_id || null}, ${data.midtrans_qr_url || null})
      RETURNING *;
    `;
    const trans = rows[0] as Transaction;

    for (const it of itemsWithHpp) {
      await sql`
        INSERT INTO transaction_items (transaction_id, harga_satuan, qty, subtotal, modal_satuan_tercatat)
        VALUES (${trans.id}, ${it.harga_satuan}, ${it.qty}, ${it.subtotal}, ${it.modal_satuan_tercatat});
      `;
    }

    if (data.status_pembayaran === 'settlement') {
      await deductBatchStock(data.total_pcs);
    }

    trans.items = itemsWithHpp;
    return trans;
  }

  const newTrans: Transaction = {
    id: memoryStore.transactions.length + 1,
    ...data,
    created_at: new Date().toISOString(),
    items: itemsWithHpp,
  };

  memoryStore.transactions.unshift(newTrans);

  if (data.status_pembayaran === 'settlement') {
    await deductBatchStock(data.total_pcs);
  }

  return newTrans;
}

export async function updateTransactionStatus(order_id: string, status: 'settlement' | 'expire' | 'cancel'): Promise<Transaction | null> {
  const sql = getNeonSql();
  if (sql) {
    const rows = await sql`
      UPDATE transactions
      SET status_pembayaran = ${status}
      WHERE order_id = ${order_id}
      RETURNING *;
    `;
    if (rows.length > 0) {
      const trans = rows[0] as Transaction;
      if (status === 'settlement') {
        await deductBatchStock(trans.total_pcs);
      }
      return trans;
    }
    return null;
  }

  const trans = memoryStore.transactions.find((t) => t.order_id === order_id);
  if (trans) {
    const prevStatus = trans.status_pembayaran;
    trans.status_pembayaran = status;
    if (status === 'settlement' && prevStatus !== 'settlement') {
      await deductBatchStock(trans.total_pcs);
    }
    return trans;
  }
  return null;
}

// 3. Expenses API
export async function getExpenses(): Promise<Expense[]> {
  const sql = getNeonSql();
  if (sql) {
    const rows = await sql`SELECT * FROM expenses ORDER BY tanggal_mulai DESC;`;
    return rows as Expense[];
  }
  return [...memoryStore.expenses].sort((a, b) => new Date(b.tanggal_mulai).getTime() - new Date(a.tanggal_mulai).getTime());
}

export async function createExpense(data: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const sql = getNeonSql();
  if (sql) {
    const rows = await sql`
      INSERT INTO expenses (jenis, deskripsi, nominal, periode, tanggal_mulai, tanggal_selesai)
      VALUES (${data.jenis}, ${data.deskripsi}, ${data.nominal}, ${data.periode}, ${data.tanggal_mulai}, ${data.tanggal_selesai || null})
      RETURNING *;
    `;
    return rows[0] as Expense;
  }

  const newExpense: Expense = {
    id: memoryStore.expenses.length + 1,
    ...data,
    created_at: new Date().toISOString(),
  };
  memoryStore.expenses.unshift(newExpense);
  return newExpense;
}

// 4. Price Presets API
export async function getPricePresets(): Promise<PricePreset[]> {
  const sql = getNeonSql();
  if (sql) {
    const rows = await sql`SELECT * FROM price_presets ORDER BY urutan ASC;`;
    if (rows.length > 0) return rows as PricePreset[];
  }
  return memoryStore.pricePresets;
}

// 5. Dashboard & Analytics Aggregator
export async function getFinancialSummary(startDate?: string, endDate?: string) {
  const allTransactions = await getTransactions();
  const allExpenses = await getExpenses();

  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate + 'T23:59:59.999Z').getTime() : Date.now();

  const filteredTrans = allTransactions.filter((t) => {
    const tTime = new Date(t.created_at).getTime();
    return tTime >= start && tTime <= end && t.status_pembayaran === 'settlement';
  });

  const totalOmzet = filteredTrans.reduce((acc, t) => acc + t.total, 0);
  const totalPcs = filteredTrans.reduce((acc, t) => acc + t.total_pcs, 0);
  const totalTransaksi = filteredTrans.length;

  let totalCogs = 0;
  for (const t of filteredTrans) {
    if (t.items && t.items.length > 0) {
      for (const it of t.items) {
        totalCogs += (it.modal_satuan_tercatat || 0) * it.qty;
      }
    }
  }

  // Calculate days difference
  const daysDiff = Math.max(1, Math.round((end - (start || Date.now() - 30 * 86400000)) / (86400000)));

  let totalRentCost = 0;
  let totalTransportCost = 0;
  let totalOtherCost = 0;

  for (const exp of allExpenses) {
    if (exp.jenis === 'sewa_tempat') {
      totalRentCost += calcAmortizedRent(exp.nominal, exp.periode, daysDiff);
    } else if (exp.jenis === 'transportasi') {
      totalTransportCost += exp.nominal;
    } else {
      totalOtherCost += exp.nominal;
    }
  }

  const labaKotor = totalOmzet - totalCogs;
  const totalOperasional = totalRentCost + totalTransportCost + totalOtherCost;
  const labaBersih = calcNetProfit(totalOmzet, totalCogs, totalRentCost, totalTransportCost + totalOtherCost);

  return {
    totalOmzet,
    totalPcs,
    totalTransaksi,
    totalCogs,
    labaKotor,
    totalRentCost,
    totalTransportCost,
    totalOtherCost,
    totalOperasional,
    labaBersih,
    transactions: filteredTrans,
  };
}
