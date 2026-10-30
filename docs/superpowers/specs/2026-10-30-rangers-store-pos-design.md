# Design Document: Rangers Store POS (Thrifting Mall & Bazar)

**Date:** 2026-10-30 (Updated)  
**Status:** In Review  
**Target Platform:** Next.js (App Router), Vercel, Neon Postgres (Direct `@neondatabase/serverless`)  

---

## 1. Intent & Real-World Context
Rangers Store adalah bisnis thrifting di mall, bazar, dan event. Karakteristik operasional nyata thrifting lapak/mall:
1. **Tidak Ada Foto Produk:** Pakaian thrift memiliki ratusan hingga ribuan item unik (1 model 1 stok). Mengambil foto setiap baju tidak realistis dan memperlambat antrean kasir.
2. **Sistem Price Tag & Kuantitas:** Baju di lapak/mall digantung berdasarkan rak harga atau diberi label tag nominal (contoh: Rp 35.000, Rp 50.000, Rp 75.000, Rp 100.000, dsb). Kasir bekerja cepat dengan memilih nominal harga lalu mengalikan dengan kuantitas yang diambil pembeli (misal: 3 pcs @ Rp 35.000 + 2 pcs @ Rp 50.000).
3. **HPP Berbasis Karung/Bal:** Modal dihitung dari pembelian karung/bal dari supplier `(harga beli + ongkir) / estimasi isi item = modal rata-rata per pcs`. Saat transaksi kasir terjadi, HPP dihitung proporsional dari jumlah pcs terjual.
4. **Eliminasi Salah Nominal QRIS:** Total belanjaan langsung dikunci ke QRIS dinamis Midtrans Sandbox — pembeli scan QR besar di layar HP/tablet tanpa bisa ubah nominal.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals (MVP)
- **Kasir Cepat Berbasis Price-Tags & Kuantitas:**
  - Tombol-tombol preset harga cepat (misal: 25k, 35k, 50k, 65k, 75k, 100k, 120k, 150k) yang bisa dikonfigurasi/ditambah.
  - Input nominal manual cepat untuk harga spesial.
  - Pengatur kuantitas instan (+ / - / keypad) per baris harga di keranjang.
  - Kalkulasi total dan opsi diskon nominal sederhana.
- **Pembayaran QRIS Dinamis Midtrans Sandbox:**
  - Generate QR dinamis terkunci presisi sesuai total keranjang via Midtrans Sandbox API.
  - Layar modal QRIS besar untuk di-scan pembeli.
  - Webhook otomatis konfirmasi settlement + tombol manual fallback (termasuk opsi pembayaran tunai / cash).
  - Mode simulasi interaktif jika API Key belum dipasang.
- **Pencatatan Batch Bal (Modal Karung):**
  - Catat pembelian bal: nama batch, supplier, harga beli bal, ongkir, jumlah pcs isi bal.
  - Menghasilkan modal rata-rata per pcs.
  - Tracking sisa pcs dalam batch saat transaksi terjual.
- **Modul Keuangan & Operasional:**
  - Input biaya sewa tempat (harian / bulanan / tahunan yang dikonversi ke biaya harian).
  - Input biaya transportasi event/bazar.
  - Metrik real-time: Omzet, Estimasi Laba Kotor (`Omzet - (Pcs Terjual × Modal Rata-rata)`), Beban Operasional, dan Laba Bersih.
- **Dashboard Performa Lapak:**
  - Ringkasan metrik hari ini: omzet, pcs terjual, estimasi laba kotor, jumlah transaksi.
  - Grafik tren omzet harian & mingguan.
  - Breakdown penjualan per tier harga terlaris.
- **Unduh Laporan PDF A4 Bulanan:**
  - Cetak laporan PDF periode bebas: ringkasan keuangan, daftar rincian transaksi, dan status rekap batch karung.
- **Clean UI & New Simpler Minimalist Logo:**
  - Desain antarmuka bersih, cepat, elegan, touch-friendly untuk smartphone & tablet.
  - Logo baru minimalis & modern "Rangers Store" (monogram RS geometris bersih).
- **Tech Stack Ringan:**
  - Next.js (App Router) + Neon Postgres direct (`@neondatabase/serverless`), tanpa ORM Drizzle.

### Non-Goals
- Tidak ada upload foto barang.
- Tidak ada input detail catalog baju satu per satu (cukup price tags & kategori/batch).
- Tidak ada modul Jastip (disiapkan untuk fase berikutnya).
- Tidak ada thermal printer hardware pairing (struk digital di layar & PDF).

### Anti-Goals
- Menghindari form input yang berbelit-belit saat transaksi kasir.
- Pembeli tidak boleh mengisi nominal bayar secara manual di QRIS.
- Tidak menggunakan ORM berat yang memperlambat startup atau deployment.

---

## 3. Tech Stack & Architecture

- **Framework:** Next.js (App Router, Server Actions, API Routes)
- **Database:** Neon PostgreSQL Serverless (menggunakan `@neondatabase/serverless` dengan SQL template tag `neon(process.env.DATABASE_URL)`)
- **Pembayaran:** Midtrans Sandbox Core API / QRIS Dinamis & Webhook
- **Laporan PDF:** Server-side PDF generation template yang bersih (A4 Portrait)
- **Styling:** Modern Clean Vanilla CSS / Tailwind yang rapi, cepat, dan responsif
- **Brand Identity:** Logo baru geometris simpel "Rangers Store"

---

## 4. Database Schema (PostgreSQL di Neon)

```sql
-- 1. Batch Karung/Bal
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    nama_batch VARCHAR(100) NOT NULL,
    supplier VARCHAR(100),
    harga_beli INT NOT NULL,
    ongkir INT NOT NULL DEFAULT 0,
    jumlah_item INT NOT NULL,
    modal_per_item INT NOT NULL, -- (harga_beli + ongkir) / jumlah_item
    sisa_item INT NOT NULL,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transaksi Kasir
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    metode_bayar VARCHAR(20) NOT NULL, -- 'qris' atau 'tunai'
    subtotal INT NOT NULL,
    diskon INT NOT NULL DEFAULT 0,
    total INT NOT NULL,
    total_pcs INT NOT NULL,
    status_pembayaran VARCHAR(20) NOT NULL, -- 'pending', 'settlement', 'expire', 'cancel'
    midtrans_transaction_id VARCHAR(100),
    midtrans_qr_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Detail Item Transaksi (Berdasarkan Tier Harga & Qty)
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id) ON DELETE CASCADE,
    harga_satuan INT NOT NULL,       -- contoh: 35000
    qty INT NOT NULL,                -- contoh: 3
    subtotal INT NOT NULL,           -- harga_satuan * qty
    modal_satuan_tercatat INT NOT NULL -- HPP per pcs saat transaksi
);

-- 4. Pengeluaran Operasional (Sewa & Transport)
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    jenis VARCHAR(30) NOT NULL, -- 'sewa_tempat', 'transportasi', 'lainnya'
    deskripsi VARCHAR(255) NOT NULL,
    nominal INT NOT NULL,
    periode VARCHAR(20) NOT NULL, -- 'harian', 'bulanan', 'sekali'
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Konfigurasi Price Presets (Opsional / Dynamic Tags)
CREATE TABLE price_presets (
    id SERIAL PRIMARY KEY,
    nominal INT NOT NULL,
    label VARCHAR(50), -- contoh: 'Kaos Thrift', 'Kemeja Flannel', 'Jaket Vintage'
    urutan INT DEFAULT 0
);
```

---

## 5. Alur Kasir Cepat (Fast POS Workflow)

1. **Kasir Melihat Grid Tombol Harga:**
   Tersedia tombol-tombol cepat seperti:
   - `[Rp 25.000]`
   - `[Rp 35.000]`
   - `[Rp 50.000]`
   - `[Rp 75.000]`
   - `[Rp 100.000]`
   - `[Rp 150.000]`
   - Serta tombol `[+ Harga Manual]` jika ada nominal fleksibel.
2. **Pilih Harga & Atur Qty:**
   - Kasir tap `[Rp 35.000]` -> masuk keranjang dengan Qty 1.
   - Jika pembeli bawa 3 potong baju 35k, kasir cukup tap tombol `+` atau klik 3x -> Qty menjadi 3 (Total Rp 105.000).
   - Kasir tap `[Rp 50.000]` 1x -> masuk keranjang (Total Rp 155.000).
3. **Diskon (Opsional):** Kasir bisa memasukkan diskon (misal potong Rp 5.000).
4. **Pilih Pembayaran:**
   - **QRIS Dinamis (Utama):** Layar memunculkan QRIS Midtrans Sandbox dengan nominal terkunci persis Rp 150.000. Pembeli scan dan bayar. Status otomatis terkonfirmasi via webhook / tombol cek status.
   - **Tunai (Cadangan):** Kasir input uang diterima, sistem hitung uang kembalian.
5. **Selesai:** Transaksi dicatat, total pcs terjual mengurangi stok pcs batch aktif, data omzet & HPP tercatat untuk laporan.

---

## 6. Desain Visual & Logo Baru "Rangers Store"

- **Konsep Logo:** Monogram "RS" modern minimalis berbentuk outline geometris bersih yang solid, melambangkan identitas toko yang rapi dan profesional di lingkungan mall.
- **Palet Warna:**
  - Charcoal Dark Slate (`#0f172a`, `#1e293b`) untuk header dan kontras tinggi.
  - Clean Off-White & Soft Border (`#f8fafc`, `#e2e8f0`) untuk layout kasir yang lapang.
  - Accent Emerald Green (`#059669`) untuk tombol checkout, status lunas, dan indikator profit.
  - Accent Electric Violet (`#6366f1`) untuk QRIS dan aksi cepat.
- **Ergonomi Kasir:** Tombol preset harga besar (mudah di-tap dengan jempol di HP atau tablet tanpa salah sentuh).
