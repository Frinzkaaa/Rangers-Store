-- Schema for Rangers Store POS (Neon PostgreSQL)

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

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    metode_bayar VARCHAR(20) NOT NULL, -- 'qris' or 'tunai'
    subtotal INT NOT NULL,
    diskon INT NOT NULL DEFAULT 0,
    total INT NOT NULL,
    total_pcs INT NOT NULL,
    status_pembayaran VARCHAR(20) NOT NULL, -- 'pending', 'settlement', 'expire', 'cancel'
    midtrans_transaction_id VARCHAR(100),
    midtrans_qr_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id) ON DELETE CASCADE,
    harga_satuan INT NOT NULL,
    qty INT NOT NULL,
    subtotal INT NOT NULL,
    modal_satuan_tercatat INT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    jenis VARCHAR(30) NOT NULL, -- 'sewa_tempat', 'transportasi', 'lainnya'
    deskripsi VARCHAR(255) NOT NULL,
    nominal INT NOT NULL,
    periode VARCHAR(20) NOT NULL, -- 'harian', 'bulanan', '3_bulan', '6_bulan', 'tahunan', 'sekali'
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_presets (
    id SERIAL PRIMARY KEY,
    nominal INT NOT NULL,
    label VARCHAR(50),
    urutan INT DEFAULT 0
);
