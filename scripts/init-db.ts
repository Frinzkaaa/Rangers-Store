import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local if present
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val.trim();
      }
    }
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || !dbUrl.startsWith('postgres')) {
    console.error('❌ Error: DATABASE_URL belum diatur atau bukan PostgreSQL URL.');
    console.error('👉 Pastikan file .env.local memiliki DATABASE_URL dari Neon Console.');
    process.exit(1);
  }

  console.log('🔄 Menghubungkan ke Neon PostgreSQL...');
  const sql = neon(dbUrl);

  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('📦 Menjalankan DDL migrasi tabel (batches, transactions, expenses, dll)...');
  
  // Execute table creation statements
  await sql`
    CREATE TABLE IF NOT EXISTS batches (
        id SERIAL PRIMARY KEY,
        nama_batch VARCHAR(100) NOT NULL,
        supplier VARCHAR(100),
        harga_beli INT NOT NULL,
        ongkir INT NOT NULL DEFAULT 0,
        jumlah_item INT NOT NULL,
        modal_per_item INT NOT NULL,
        sisa_item INT NOT NULL,
        catatan TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        metode_bayar VARCHAR(20) NOT NULL,
        subtotal INT NOT NULL,
        diskon INT NOT NULL DEFAULT 0,
        total INT NOT NULL,
        total_pcs INT NOT NULL,
        status_pembayaran VARCHAR(20) NOT NULL,
        midtrans_transaction_id VARCHAR(100),
        midtrans_qr_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transaction_items (
        id SERIAL PRIMARY KEY,
        transaction_id INT REFERENCES transactions(id) ON DELETE CASCADE,
        harga_satuan INT NOT NULL,
        qty INT NOT NULL,
        subtotal INT NOT NULL,
        modal_satuan_tercatat INT NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        jenis VARCHAR(30) NOT NULL,
        deskripsi VARCHAR(255) NOT NULL,
        nominal INT NOT NULL,
        periode VARCHAR(20) NOT NULL,
        tanggal_mulai DATE NOT NULL,
        tanggal_selesai DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS price_presets (
        id SERIAL PRIMARY KEY,
        nominal INT NOT NULL,
        label VARCHAR(50),
        urutan INT DEFAULT 0
    );
  `;

  console.log('✅ Semua tabel berhasil dibuat di Neon PostgreSQL!');

  // Check if sample data needed
  const existingBatches = await sql`SELECT count(*) FROM batches;`;
  if (Number(existingBatches[0].count) === 0) {
    console.log('🌱 Mengisi sample data batch awal...');
    await sql`
      INSERT INTO batches (nama_batch, supplier, harga_beli, ongkir, jumlah_item, modal_per_item, sisa_item, catatan)
      VALUES 
      ('Bal Crewneck & Kaos USA Nov #1', 'Pasar Senen Blok III (Pak Hendra)', 3500000, 150000, 120, 30417, 120, 'Sortir grade A & B'),
      ('Bal Jaket Vintage Japan', 'Supplier Bandung Import', 4200000, 200000, 80, 55000, 80, 'Jaket outdoor 90s');
    `;
    console.log('✅ Sample data batch berhasil ditambahkan.');
  }

  console.log('🎉 Setup Neon PostgreSQL selesai! Aplikasi siap digunakan.');
}

main().catch((err) => {
  console.error('❌ Terjadi kesalahan saat inisialisasi database:', err);
  process.exit(1);
});
