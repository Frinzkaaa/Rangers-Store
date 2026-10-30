# Design Document: Rangers Store POS (Thrifting & Kasir Pintar)

**Date:** 2026-10-30  
**Status:** In Review  
**Target Platform:** Next.js (App Router), Vercel, Neon Postgres, Drizzle ORM  

---

## 1. Intent & Context
Rangers Store adalah bisnis ritel thrifting yang aktif berjualan di lapak fisik, bazar, dan event komunitas. Transaksi di lapak thrift memiliki karakteristik khusus:
1. **Stok unik (qty 1):** Setiap pakaian/barang adalah item tunggal (one-off), bukan stok massal.
2. **HPP Berbasis Karung/Bal:** Barang dibeli per karung/bal (bulk), sehingga harga modal per item merupakan estimasi rata-rata `(harga beli bal + ongkir) / jumlah item` dengan opsi penyesuaian (override) per item bernilai tinggi.
3. **Risiko Salah Nominal QRIS:** Pembeli kerap salah ketik nominal saat scan QRIS statis biasa. Sistem ini mengunci nominal secara otomatis ke QRIS dinamis via Midtrans Sandbox.
4. **Biaya Operasional Nyata:** Laba bersih harus memperhitungkan sewa lapak (dihitung proporsional harian) dan biaya transportasi event.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals (MVP)
- **Katalog Barang & Batch Bal:** Pencatatan batch karung (supplier, harga beli, ongkir, estimasi item). Otomatisasi HPP per item + opsi override manual per item. Input SKU, foto, harga jual, dan status (`tersedia` / `terjual`).
- **Kasir Cepat (POS):** Pemilihan barang (klik atau cari/scan SKU), keranjang belanja, kalkulasi diskon nominal, dan checkout.
- **QRIS Dinamis Midtrans Sandbox:** Generate QRIS dinamis terkunci berdasarkan total keranjang belanja tanpa input manual nominal oleh kasir/pembeli. Notifikasi pembayaran otomatis via webhook Midtrans + fallback opsi tunai (cash).
- **Dashboard & Analisis Finansial:** Kartu metrik hari ini (omzet, item terjual, estimasi laba kotor, jumlah transaksi), grafik tren omzet/laba, breakdown barang terlaris, dan ringkasan stok.
- **Pencatatan Biaya Operasional:** Input biaya sewa tempat (harian/bulanan/tahunan yang diamortisasi per hari) dan transportasi event, menghasilkan kalkulasi laba bersih riil.
- **Ekspor Laporan PDF A4:** Download laporan rekap keuangan dan audit transaksi per rentang tanggal (header toko, ringkasan laba rugi, daftar transaksi detail per SKU, dan rekap batch bal).
- **Branding & UI Bersih:** Desain antarmuka modern, bersih, minimalis, responsif di HP/tablet/desktop, dilengkapi logo baru minimalis "Rangers Store".
- **Vercel & Neon Ready:** Berjalan langsung di Vercel dengan Neon Serverless Postgres via Drizzle ORM.

### Non-Goals (Fase 2+)
- Modul Jastip (preorder, DP, pelunasan bertahap, kurs valuta asing, resi kurir).
- Multi-user role dan multi-cabang.
- Integrasi marketplace (Shopee/Tokopedia) dan live selling.
- Cetak struk printer thermal Bluetooth (cukup preview struk digital dan PDF).
- QRIS Midtrans Production (fase MVP menggunakan Midtrans Sandbox).

### Anti-Goals
- Tidak mengizinkan pembeli mengisi nominal QRIS sendiri secara manual.
- Tidak membuat alur kasir yang rumit (harus cepat, selesai dalam 2-3 tap di smartphone/tablet lapak).
- Tidak menyimpan file gambar binary besar langsung di database (menggunakan URL storage/Vercel Blob/Cloudinary atau data URI teroptimasi).

---

## 3. Approaches Considered

### Pendekatan A: Next.js + Drizzle ORM dengan SQLite Lokal
- Drizzle ORM dihubungkan ke `better-sqlite3` lokal terlebih dahulu untuk pengembangan offline tanpa akun cloud.
- *Trade-off:* Memerlukan migrasi konfigurasi driver Drizzle saat ingin deploy ke Vercel dengan Neon.

### Pendekatan B (Dipilih oleh Pengguna): Next.js + Drizzle ORM Langsung ke Neon Postgres
- Menggunakan driver `@neondatabase/serverless` dengan Drizzle PostgreSQL dari hari pertama.
- *Trade-off:* Membutuhkan variabel lingkungan `DATABASE_URL` untuk koneksi langsung ke Neon Postgres. Untuk kemudahan uji coba jika koneksi belum dimasukkan, builder menyediakan mekanisme fallback konfigurasi atau mock dev connection yang anggun.
- *Alasan Dipilih:* Sesuai keputusan pengguna agar kode dan arsitektur langsung siap deploy ke Vercel tanpa perlu perombakan driver database.

---

## 4. Architectural Blueprint

### Tech Stack
- **Framework:** Next.js 14+ (App Router, Server Actions, API Routes)
- **Database:** Neon PostgreSQL Serverless
- **ORM:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Pembayaran:** Midtrans Sandbox API (Core API / Snap QRIS dinamis) & Webhook Handler
- **Laporan PDF:** `@react-pdf/renderer` atau template PDF engine server-side teroptimasi
- **Styling:** Modern Clean Vanilla CSS / CSS Modules / Tailwind (sesuai guideline UI bersih & elegan)
- **Icons & Assets:** Lucide React Icons + Custom SVG Minimalist Logo "Rangers Store"

### Database Schema (Drizzle Postgres)
1. `batches`:
   - `id`: serial / uuid primary key
   - `nama_batch`: varchar (e.g. "Bal Crewneck Vintage #1")
   - `supplier`: varchar
   - `harga_beli`: integer (dalam rupiah)
   - `ongkir`: integer
   - `jumlah_item`: integer
   - `modal_per_item`: integer (dihitung otomatis: `(harga_beli + ongkir) / jumlah_item`)
   - `catatan`: text
   - `created_at`: timestamp
2. `items`:
   - `id`: serial / uuid primary key
   - `batch_id`: integer references `batches.id` (nullable untuk barang non-batch)
   - `sku`: varchar unique (e.g. "RNG-2610-001")
   - `nama`: varchar (e.g. "Nike Vintage Windbreaker 90s")
   - `kategori`: varchar (Jaket, Kaus, Celana, Sepatu, Aksesoris, dll)
   - `foto_url`: text
   - `harga_modal_override`: integer nullable (jika ada barang istimewa di dalam bal)
   - `harga_jual`: integer
   - `status`: varchar ("tersedia", "terjual")
   - `created_at`: timestamp
3. `transactions`:
   - `id`: serial / uuid primary key
   - `order_id`: varchar unique (e.g. "TRX-20261030-001")
   - `metode_bayar`: varchar ("qris", "tunai")
   - `subtotal`: integer
   - `diskon`: integer default 0
   - `total`: integer
   - `status_pembayaran`: varchar ("pending", "settlement", "expire", "cancel")
   - `midtrans_transaction_id`: varchar nullable
   - `midtrans_qr_url`: text nullable
   - `created_at`: timestamp
4. `transaction_items`:
   - `id`: serial / uuid primary key
   - `transaction_id`: integer references `transactions.id`
   - `item_id`: integer references `items.id`
   - `harga_jual`: integer
   - `harga_modal_tercatat`: integer (HPP item saat transaksi terjadi untuk audit akurat)
5. `expenses`:
   - `id`: serial / uuid primary key
   - `jenis`: varchar ("sewa_tempat", "transportasi", "lainnya")
   - `deskripsi`: varchar
   - `nominal`: integer
   - `periode`: varchar ("harian", "bulanan", "3_bulan", "6_bulan", "tahunan", "sekali")
   - `tanggal_mulai`: date
   - `tanggal_selesai`: date nullable
   - `created_at`: timestamp

---

## 5. Key Module Workflows

### A. Kasir & QRIS Dinamis Midtrans (The 7-Step Flow)
1. Kasir mencari barang via SKU atau klik barang di katalog.
2. Keranjang mengakumulasi barang (qty 1 per item), kasir bisa input diskon nominal jika ada negosiasi.
3. Kasir klik "Bayar QRIS" (atau "Bayar Tunai").
4. Sistem membuat transaksi di DB dan memanggil endpoint Midtrans Sandbox Charge (`payment_type: "qris"`).
5. Layar menampilkan modal/halaman QRIS ukuran besar dengan nominal terkunci presisi sesuai total keranjang.
6. Pembeli scan via GoPay/BCA/ShopeePay/dana/e-wallet lainnya di sandbox simulator Midtrans.
7. Webhook Midtrans (`/api/midtrans/webhook`) menerima `settlement` -> status transaksi menjadi `settlement`, status item-item di DB otomatis diperbarui menjadi `terjual`.
*(Catatan: Tombol cek status manual / simulasi sukses bayar juga disediakan di UI kasir untuk kemudahan testing tanpa menunggu webhook).*

### B. Kalkulasi Finansial
- **Omzet:** Jumlah `total` transaksi berstatus `settlement`.
- **Modal Terjual:** Akumulasi `harga_modal_tercatat` dari semua item yang terjual.
- **Laba Kotor:** `Omzet - Modal Terjual`.
- **Beban Sewa Harian:** Untuk sewa bulanan: `nominal / 30 * jumlah_hari_periode`. Untuk harian: `nominal * hari`.
- **Beban Transportasi:** Total entri transportasi di rentang tanggal terpilih.
- **Laba Bersih:** `Laba Kotor - Beban Sewa - Beban Transportasi`.

### C. Laporan PDF Bulanan
- Mengakses `/api/laporan/pdf?start=YYYY-MM-DD&end=YYYY-MM-DD`.
- Menghasilkan dokumen A4 portrait yang rapi:
  - Header: Logo Rangers Store, Nama Lapak, Periode Laporan.
  - Ringkasan Finansial: Omzet, Laba Kotor, Operasional, Laba Bersih.
  - Tabel Transaksi: Waktu, No Order, Metode, SKU & Nama Item, Total.
  - Rekap Batch Bal: Status penjualan per batch karung.

---

## 6. Visual & Brand Design Guidelines
- **Logo Rangers Store:** Minimalis, clean, geometric badge/monogram "RS" modern dengan tipografi sans-serif bersih, melambangkan eksplorasi kurasi pakaian vintage.
- **Color Palette:**
  - Dark Slate / Deep Charcoal (`#0f172a` / `#1e293b`) untuk kontras dan keterbacaan tinggi di outdoor bazar.
  - Pure Clean White (`#ffffff`) & Subtle Gray (`#f8fafc`) sebagai background card.
  - Emerald / Forest Accent (`#10b981`) untuk status sukses, kasir, dan profit.
  - Indigo / Violet Soft Accent (`#6366f1`) untuk QRIS dan aksi utama.
- **Responsive Layout:**
  - Sidebar ramping di desktop, bottom navigation / header bar responsif di tablet dan smartphone.
  - Touch target minimal 44x44px untuk kenyamanan kasir di layar sentuh.

---

## 7. What is Left to the Builder
- Penataan struktur komponen Next.js (`app/`, `components/`, `lib/`).
- Mock/helper fallback jika `DATABASE_URL` atau `MIDTRANS_SERVER_KEY` belum diisi di `.env.local` agar aplikasi tetap dapat di-boot dan dicoba secara visual tanpa error blocking.
- Komposisi layout PDF yang proporsional dan tidak terpotong.
