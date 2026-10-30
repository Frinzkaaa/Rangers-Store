# Rangers Store POS (Thrifting Mall & Bazar) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi POS kasir modern berbasis web untuk Rangers Store dengan fokus pada kasir cepat berbasis price-tier/kuantitas, QRIS dinamis terkunci via Midtrans Sandbox, pencatatan HPP batch karung/bal, manajemen biaya operasional (sewa & transport), dashboard performa, dan ekspor laporan PDF bulanan.

**Architecture:** Next.js App Router full-stack dengan antarmuka kasir cepat berbasis tier harga tanpa upload foto. Database langsung menggunakan Neon PostgreSQL (`@neondatabase/serverless`) dengan fallback in-memory yang tangguh saat offline/dev mode. API routes terdedikasi untuk Midtrans Sandbox QRIS dan PDF stream generator.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, `@neondatabase/serverless`, Midtrans Sandbox API, Lucide React, jsPDF, Vanilla/Tailwind modern clean CSS.

**Spec:** [docs/superpowers/specs/2026-10-30-rangers-store-pos-design.md](file:///home/frinzka/Documents/rangers-store%20(copy)/docs/superpowers/specs/2026-10-30-rangers-store-pos-design.md)

## Global Constraints
- Tidak menggunakan Drizzle ORM — menggunakan `@neondatabase/serverless` query langsung.
- Tidak ada upload foto produk — antarmuka kasir berorientasi pada tombol preset harga dan pengali kuantitas.
- Pembayaran QRIS harus mengunci nominal total keranjang belanja tanpa input manual pembeli.
- Menggunakan Midtrans Sandbox untuk lingkungan pembayaran saat ini.
- Tampilan UI harus bersih, modern, kontras tinggi, dan menggunakan logo baru minimalis untuk "Rangers Store".

## Review Focus
1. **Total Keranjang Nol atau Negatif:** Keranjang tidak boleh di-checkout jika total 0 atau diskon melebihi subtotal; tombol checkout harus nonaktif.
2. **Koneksi Database Offline:** Jika `DATABASE_URL` belum diset atau koneksi internet mati, aplikasi harus menggunakan mock store in-memory/localStorage secara otomatis tanpa crashing.
3. **Midtrans Sandbox Fallback:** Jika `MIDTRANS_SERVER_KEY` belum diset di environment, pembuat QR harus menghasilkan QR simulasi yang valid dan menyediakan tombol simulasi bayar sukses untuk pengujian.
4. **Kalkulasi HPP Bal Kosong:** Jika belum ada batch bal yang dicatat saat transaksi, HPP diset ke 0 dan peringatan modal belum diinput tampil di halaman keuangan tanpa merusak kalkulasi omzet.
5. **Amortisasi Sewa Tempat:** Biaya sewa bulanan harus dihitung proporsional harian `(nominal / 30 * hari_dalam_periode)` saat menghitung laba bersih pada rentang tanggal tertentu.

---

### Task 1: Next.js Project Scaffolding & Clean Design System

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/components/Logo.tsx`
- Create: `src/components/Navbar.tsx`
- Test: `tests/brand.test.ts`

**Interfaces:**
- Produces: `Logo`: React component rendering minimal modern SVG monogram & wordmark "Rangers Store"
- Produces: `Navbar`: Clean top navigation bar linking to `/pos`, `/dashboard`, `/batches`, `/keuangan`

- [ ] **Step 1: Write unit test for brand and layout constants**
Create `tests/brand.test.ts` asserting brand name is "Rangers Store" and navigation items include POS, Dashboard, Batches, and Keuangan.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx ts-node tests/brand.test.ts` (Expected: FAIL, files not yet created)
- [ ] **Step 3: Initialize project configuration & dependencies**
Create `package.json` with Next.js, React, `@neondatabase/serverless`, `lucide-react`, `jspdf`, and install dependencies.
- [ ] **Step 4: Create new minimalist "Rangers Store" SVG Logo & Navbar**
Implement `src/components/Logo.tsx` featuring a clean geometric modern "RS" monogram with clean sans-serif typography, and `src/components/Navbar.tsx`.
- [ ] **Step 5: Create global CSS design system**
Implement `src/app/globals.css` with a refined color palette (Dark Slate `#0f172a`, Off-white `#f8fafc`, Emerald `#059669`, Violet `#6366f1`) and responsive layout containers.
- [ ] **Step 6: Run test to verify it passes**
Run: `npx ts-node tests/brand.test.ts` (Expected: PASS)
- [ ] **Step 7: Commit**
```bash
git add package.json tsconfig.json next.config.mjs src/ tests/
git commit -m "feat: initialize Next.js scaffolding with clean design system and Rangers Store logo"
```

---

### Task 2: Neon Postgres Database Layer & Financial Engine

**Files:**
- Create: `src/lib/schema.sql`
- Create: `src/lib/db.ts`
- Create: `src/lib/calc.ts`
- Test: `tests/calc.test.ts`

**Interfaces:**
- Produces: `query(sql: string, params?: any[])`: Executes query against Neon Postgres or fallback store
- Produces: `calcBatchUnitCost(hargaBeli: number, ongkir: number, jumlahItem: number): number`
- Produces: `calcNetProfit(omzet: number, cogs: number, rentCost: number, transportCost: number): number`
- Produces: `calcAmortizedRent(rentNominal: number, periode: string, daysInFilter: number): number`

- [ ] **Step 1: Write test for financial calculation utilities**
Create `tests/calc.test.ts` testing unit cost `(1.500.000 + 100.000) / 100 = 16.000`, amortized monthly rent for 7 days `(1.500.000 / 30) * 7 = 350.000`, and net profit `omzet - cogs - rent - transport`.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx ts-node tests/calc.test.ts` (Expected: FAIL, calc module not found)
- [ ] **Step 3: Implement `src/lib/calc.ts`**
Implement calculation functions with rounding to nearest rupiah.
- [ ] **Step 4: Create `src/lib/schema.sql` and `src/lib/db.ts`**
Write DDL script and database abstraction layer using `@neondatabase/serverless` with in-memory memory store fallback when `DATABASE_URL` is empty.
- [ ] **Step 5: Run test to verify it passes**
Run: `npx ts-node tests/calc.test.ts` (Expected: PASS)
- [ ] **Step 6: Commit**
```bash
git add src/lib/ tests/calc.test.ts
git commit -m "feat: add database client and financial calculation engine"
```

---

### Task 3: Fast Price-Tier POS Kasir & Cart Management

**Files:**
- Create: `src/components/PosCashier.tsx`
- Create: `src/components/CashModal.tsx`
- Create: `src/app/pos/page.tsx`
- Create: `src/app/page.tsx`
- Test: `tests/pos-cart.test.ts`

**Interfaces:**
- Consumes: `src/lib/calc.ts`
- Produces: `PosCashier`: Fast cashier UI with price preset buttons (25k, 35k, 50k, 75k, 100k, 150k + custom), cart items with quantity adjuster, and checkout trigger
- Produces: `CashModal`: Cash payment popup with quick money suggestions and change calculation

- [ ] **Step 1: Write test for cart logic**
Create `tests/pos-cart.test.ts` asserting price tag addition, quantity multiplication (`35.000 × 3 = 105.000`), discount subtraction, and validation preventing checkout when total is <= 0.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx ts-node tests/pos-cart.test.ts` (Expected: FAIL)
- [ ] **Step 3: Implement cart state manager and CashModal**
Build `src/components/CashModal.tsx` supporting nominal calculations (e.g., input received Rp 200.000 for Rp 155.000 total -> kembalian Rp 45.000).
- [ ] **Step 4: Implement `src/components/PosCashier.tsx` and `/pos` page**
Build touch-friendly preset buttons with large text, active cart drawer, and clean responsive layout.
- [ ] **Step 5: Run test to verify it passes**
Run: `npx ts-node tests/pos-cart.test.ts` (Expected: PASS)
- [ ] **Step 6: Commit**
```bash
git add src/components/PosCashier.tsx src/components/CashModal.tsx src/app/pos/ src/app/page.tsx tests/pos-cart.test.ts
git commit -m "feat: add fast price-tier POS cashier and cash payment flow"
```

---

### Task 4: Midtrans Sandbox Dynamic Locked QRIS

**Files:**
- Create: `src/lib/midtrans.ts`
- Create: `src/app/api/midtrans/charge/route.ts`
- Create: `src/app/api/midtrans/status/route.ts`
- Create: `src/app/api/midtrans/webhook/route.ts`
- Create: `src/components/QrisModal.tsx`
- Test: `tests/midtrans.test.ts`

**Interfaces:**
- Consumes: `src/lib/db.ts`
- Produces: `POST /api/midtrans/charge`: Generates locked QRIS charge with order_id and gross_amount
- Produces: `GET /api/midtrans/status?order_id=...`: Fetches payment status
- Produces: `POST /api/midtrans/webhook`: Handles settlement notification
- Produces: `QrisModal`: Large QR display modal with auto-check status and manual simulation button

- [ ] **Step 1: Write test for Midtrans QRIS charge payload**
Create `tests/midtrans.test.ts` verifying order ID format `TRX-YYYYMMDD-XXXX`, gross amount locking, and webhook signature verification.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx ts-node tests/midtrans.test.ts` (Expected: FAIL)
- [ ] **Step 3: Implement `src/lib/midtrans.ts` and API routes**
Implement server charge endpoint generating QR code URL / QR string via Midtrans Core API (with sandbox mock generation when credentials are absent).
- [ ] **Step 4: Implement `src/components/QrisModal.tsx`**
Build modal displaying large high-contrast QR code, amount lock badge ("Nominal Terkunci: Rp 150.000"), countdown expiry timer, and "Cek Status / Simulasi Bayar" button.
- [ ] **Step 5: Run test to verify it passes**
Run: `npx ts-node tests/midtrans.test.ts` (Expected: PASS)
- [ ] **Step 6: Commit**
```bash
git add src/lib/midtrans.ts src/app/api/midtrans/ src/components/QrisModal.tsx tests/midtrans.test.ts
git commit -m "feat: implement Midtrans Sandbox dynamic locked QRIS payment module"
```

---

### Task 5: Batch Bal Management & Inventory Modal Tracking

**Files:**
- Create: `src/app/batches/page.tsx`
- Create: `src/app/api/batches/route.ts`
- Test: `tests/batches.test.ts`

**Interfaces:**
- Consumes: `src/lib/db.ts`, `src/lib/calc.ts`
- Produces: `POST /api/batches`: Creates new batch (supplier, harga_beli, ongkir, jumlah_item)
- Produces: `GET /api/batches`: Lists active batches, unit cost, and remaining pcs
- Produces: `/batches` page with quick input form and active inventory cards

- [ ] **Step 1: Write test for batch stock deduction and average HPP**
Create `tests/batches.test.ts` verifying that creating a batch with 100 pcs @ Rp 16.000 unit cost and deducting 5 pcs leaves 95 pcs.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx ts-node tests/batches.test.ts` (Expected: FAIL)
- [ ] **Step 3: Implement batch API route `src/app/api/batches/route.ts`**
Handle batch creation, listing, and remaining items tracking.
- [ ] **Step 4: Implement `/batches` UI page**
Clean card-based batch manager showing batch name, supplier, total cost, average cost per piece, and remaining pieces.
- [ ] **Step 5: Run test to verify it passes**
Run: `npx ts-node tests/batches.test.ts` (Expected: PASS)
- [ ] **Step 6: Commit**
```bash
git add src/app/batches/ src/app/api/batches/ tests/batches.test.ts
git commit -m "feat: add sack batch bal inventory and COGS tracking"
```

---

### Task 6: Financial Management (Sewa, Transport, Laba Bersih) & Dashboard

**Files:**
- Create: `src/app/keuangan/page.tsx`
- Create: `src/app/api/expenses/route.ts`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/api/dashboard/route.ts`
- Test: `tests/keuangan.test.ts`

**Interfaces:**
- Consumes: `src/lib/db.ts`, `src/lib/calc.ts`
- Produces: `/keuangan` page with date filter, operational expense inputs, and net profit report
- Produces: `/dashboard` page with daily metrics cards (omzet, pcs terjual, laba kotor estimasi, total transaksi) and sales breakdown charts

- [ ] **Step 1: Write test for financial aggregation**
Create `tests/keuangan.test.ts` verifying total omzet, COGS deduction, operational rent & transport subtraction, resulting in accurate net profit.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx ts-node tests/keuangan.test.ts` (Expected: FAIL)
- [ ] **Step 3: Implement `src/app/api/expenses/route.ts` and `src/app/api/dashboard/route.ts`**
Build endpoints aggregating transactions, item sales, and expenses by date range.
- [ ] **Step 4: Implement `/keuangan` and `/dashboard` UI**
Build clean metric cards, date range picker, expense entry dialog, and interactive breakdown charts.
- [ ] **Step 5: Run test to verify it passes**
Run: `npx ts-node tests/keuangan.test.ts` (Expected: PASS)
- [ ] **Step 6: Commit**
```bash
git add src/app/keuangan/ src/app/dashboard/ src/app/api/expenses/ src/app/api/dashboard/ tests/keuangan.test.ts
git commit -m "feat: add operational financial management and dashboard analytics"
```

---

### Task 7: Monthly Audit Report PDF Generator

**Files:**
- Create: `src/lib/pdf.ts`
- Create: `src/app/api/laporan/pdf/route.ts`
- Test: `tests/pdf.test.ts`

**Interfaces:**
- Consumes: `src/lib/db.ts`, `src/lib/calc.ts`
- Produces: `GET /api/laporan/pdf?start=YYYY-MM-DD&end=YYYY-MM-DD`: Streams formatted A4 PDF document containing header, financial summary, transaction details, and batch recap

- [ ] **Step 1: Write test for PDF data payload structuring**
Create `tests/pdf.test.ts` testing that report builder formats currency in IDR (e.g. "Rp 150.000"), handles date periods, and includes transaction audit rows.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx ts-node tests/pdf.test.ts` (Expected: FAIL)
- [ ] **Step 3: Implement `src/lib/pdf.ts` and `/api/laporan/pdf/route.ts`**
Create clean A4 portrait layout with "Rangers Store" header, period summary, transaction ledger table, and operational cost breakdown.
- [ ] **Step 4: Add "Unduh Laporan PDF" button in `/keuangan`**
Connect date range picker in `/keuangan` to download the generated PDF directly in the browser.
- [ ] **Step 5: Run test to verify it passes**
Run: `npx ts-node tests/pdf.test.ts` (Expected: PASS)
- [ ] **Step 6: Commit**
```bash
git add src/lib/pdf.ts src/app/api/laporan/pdf/ tests/pdf.test.ts
git commit -m "feat: add monthly A4 audit PDF report generation"
```

---

### Task 8: End-to-End Verification, Seed Data & Polish

**Files:**
- Create: `src/lib/seed.ts`
- Modify: `src/app/layout.tsx`
- Test: Full end-to-end checkout flow test

- [ ] **Step 1: Implement demo seed data**
Create seed data with preset prices (25k, 35k, 50k, 75k, 100k, 150k), sample batch bal, and dummy expenses so the app is instantly rich with data on first load.
- [ ] **Step 2: Run complete test suite**
Run all tests: `npm test` or `npx ts-node` test runner and verify all pass.
- [ ] **Step 3: Build verification**
Run: `npm run build` and ensure Next.js build succeeds with zero errors.
- [ ] **Step 4: Final commit**
```bash
git add .
git commit -m "feat: complete Rangers Store POS MVP with seed data and verified build"
```
