# Rangers Store POS (Thrifting Mall & Bazar)

Aplikasi kasir pintar (POS) modern, cepat, dan ringan khusus lapak thrifting mall, bazar, dan event komunitas.

---

## ⚡ Fitur Utama

1. **Kasir Cepat Berbasis Price-Tags & Kuantitas:**
   - Tidak perlu memotret ribuan baju satuan (1 model 1 stok).
   - Tap tombol preset harga rak baju (`25.000`, `35.000`, `50.000`, `75.000`, `100.000`, `150.000`) atau masukkan harga manual, lalu atur kuantitas barang yang diambil pembeli.
2. **QRIS Dinamis Terkunci (Midtrans Sandbox):**
   - Total keranjang belanja otomatis dikunci ke QRIS dinamis — mengeliminasi salah ketik nominal oleh pembeli.
   - Layar modal QRIS besar untuk di-scan pembeli + tombol cek status otomatis & simulasi instan.
3. **Pembayaran Tunai (Cash Fallback):**
   - Perhitungan uang diterima dan kembalian otomatis dengan chip nominal cepat.
4. **Manajemen Batch Bal (Karungan):**
   - Pencatatan pembelian karung/bal (supplier, harga beli, ongkir, estimasi isi item).
   - Menghitung modal HPP rata-rata per potong baju secara otomatis dan mengurangi sisa stok secara real-time saat transaksi selesai.
5. **Manajemen Biaya Operasional & Laba Bersih:**
   - Input sewa tempat (dihitung proporsional harian) dan biaya transportasi event.
   - Perhitungan laba kotor (`Omzet - Modal Bal Terjual`) dan laba bersih riil (`Laba Kotor - Biaya Operasional`).
6. **Laporan Audit PDF A4 Bulanan:**
   - Ekspor laporan audit keuangan format PDF A4 rapi untuk rentang tanggal bebas dipilih (ringkasan laba rugi, daftar transaksi detail, dan rekap batch karung).
7. **Branding Baru & UI Bersih:**
   - Desain antarmuka bersih, elegan, dan kontras tinggi dengan logo baru minimalis modern **Rangers Store**.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Neon PostgreSQL Serverless (`@neondatabase/serverless`)
- **Payment Gateway:** Midtrans Sandbox API (QRIS Dinamis)
- **PDF Engine:** jsPDF
- **Icons:** Lucide React

---

## 🚀 Cara Menjalankan

### 1. Jalankan Development Server
```bash
npm install
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000). Aplikasi otomatis mengarahkan ke halaman Kasir POS (`/pos`).

*Catatan:* Aplikasi memiliki mode dev/demo interaktif secara bawaan. Anda dapat langsung mencoba kasir, scan QRIS simulasi, dan mencatat transaksi tanpa harus mengisi `DATABASE_URL` atau `MIDTRANS_SERVER_KEY` terlebih dahulu!

### 2. Menjalankan Seluruh Pengujian (TDD Suite)
```bash
npm test
```

### 3. Build untuk Produksi
```bash
npm run build
```

---

## 🌐 Deploy ke Vercel

1. Push repository ke GitHub.
2. Import project ke [Vercel](https://vercel.com).
3. Di **Project Settings -> Environment Variables**, tambahkan:
   - `DATABASE_URL`: Connection string PostgreSQL dari Neon.
   - `MIDTRANS_SERVER_KEY`: Server Key Sandbox dari Midtrans Dashboard.
   - `MIDTRANS_CLIENT_KEY`: Client Key Sandbox dari Midtrans Dashboard.
4. Deploy! Aplikasi siap digunakan di smartphone, tablet, maupun laptop di lapak bazar Anda.
