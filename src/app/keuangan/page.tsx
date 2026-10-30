'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah, formatTanggalIndo, calcDailyRent } from '../../lib/calc';
import { Expense } from '../../lib/db';
import {
  CircleDollarSign,
  TrendingUp,
  Receipt,
  Plus,
  Calendar,
  Building,
  Truck,
  Download,
  X,
  Pencil,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function KeuanganPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Date filters (defaults to current month: first day to current day)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Expense Form State
  const [jenis, setJenis] = useState<'sewa_tempat' | 'transportasi' | 'lainnya'>('sewa_tempat');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [nominal, setNominal] = useState<string>('');
  const [periode, setPeriode] = useState<string>('bulanan');
  const [tglMulai, setTglMulai] = useState<string>(todayStr);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/dashboard?start=${startDate}&end=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSummaryData(data.summary);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    fetch('/api/expenses')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExpenses(data.expenses);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setJenis('sewa_tempat');
    setDeskripsi('');
    setNominal('');
    setPeriode('bulanan');
    setTglMulai(todayStr);
    setShowExpenseModal(true);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setJenis(exp.jenis);
    setDeskripsi(exp.deskripsi);
    setNominal(String(exp.nominal));
    setPeriode(exp.periode);
    // Format YYYY-MM-DD for date input
    const dStr = exp.tanggal_mulai ? new Date(exp.tanggal_mulai).toISOString().split('T')[0] : todayStr;
    setTglMulai(dStr);
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingExpense) {
        // Edit existing
        const res = await fetch('/api/expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingExpense.id,
            jenis,
            deskripsi,
            nominal: Number(nominal),
            periode,
            tanggal_mulai: tglMulai,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowExpenseModal(false);
          fetchData();
        } else {
          alert(data.error || 'Gagal mengubah pengeluaran');
        }
      } else {
        // Create new
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jenis,
            deskripsi,
            nominal: Number(nominal),
            periode,
            tanggal_mulai: tglMulai,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowExpenseModal(false);
          fetchData();
        } else {
          alert(data.error || 'Gagal menyimpan pengeluaran');
        }
      }
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number, deskripsi: string) => {
    if (!confirm(`Hapus catatan biaya "${deskripsi}"?`)) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Gagal menghapus pengeluaran');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/laporan/pdf?start=${startDate}&end=${endDate}`, '_blank');
  };

  // Preview daily rent rate in form
  const previewDailyRate = calcDailyRent(Number(nominal || 0), periode);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Laporan Keuangan & Laba Bersih
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Perhitungan cerdas laba bersih riil: amortisasi sewa lapak harian proporsional, modal bal (HPP), dan biaya operasional bazar.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn btn-outline"
            style={{ fontSize: '13px', gap: '6px' }}
          >
            <Plus size={16} />
            <span>+ Catat Biaya Operasional</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="btn btn-emerald"
            style={{ fontSize: '13px', gap: '6px' }}
          >
            <Download size={16} />
            <span>Unduh Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="clean-card" style={{ padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
          <Calendar size={18} color="#059669" />
          <span>Filter Periode Laporan:</span>
          {summaryData?.daysDiff && (
            <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              {summaryData.daysDiff} Hari Terpilih
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
          />
          <span style={{ color: '#94a3b8' }}>s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Financial Metric Cards (Terpisah & Masuk Akal) */}
      {summaryData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* 1. Omzet */}
          <div className="clean-card">
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Omzet Penjualan
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              {formatRupiah(summaryData.totalOmzet)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {summaryData.totalPcs} pcs ({summaryData.totalTransaksi} transaksi)
            </div>
          </div>

          {/* 2. Modal Bal (HPP) */}
          <div className="clean-card">
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Modal Bal (HPP Terjual)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#64748b', marginTop: '6px' }}>
              {formatRupiah(summaryData.totalCogs)}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              HPP modal pakaian terjual
            </div>
          </div>

          {/* 3. Laba Kotor */}
          <div className="clean-card">
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estimasi Laba Kotor
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
              {formatRupiah(summaryData.labaKotor)}
            </div>
            <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px' }}>
              Omzet dikurangi Modal Bal
            </div>
          </div>

          {/* 4. Beban Sewa Lapak Harian */}
          <div className="clean-card">
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Beban Sewa Lapak
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
              {formatRupiah(summaryData.totalRentCost || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px', fontWeight: 600 }}>
              {formatRupiah(summaryData.totalDailyRentRate || 0)}/hari x {summaryData.daysDiff} hari
            </div>
          </div>

          {/* 5. Beban Transport & Ops Terpisah */}
          <div className="clean-card">
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Transport & Ops Bazar
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
              {formatRupiah((summaryData.totalTransportCost || 0) + (summaryData.totalOtherCost || 0))}
            </div>
            <div style={{ fontSize: '12px', color: '#9a3412', marginTop: '4px' }}>
              Biaya pick-up & operasional riil
            </div>
          </div>

          {/* 6. Laba Bersih Riil */}
          <div
            className="clean-card"
            style={{
              background: summaryData.labaBersih >= 0 ? '#ecfdf5' : '#fef2f2',
              borderColor: summaryData.labaBersih >= 0 ? '#a7f3d0' : '#fecaca',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: summaryData.labaBersih >= 0 ? '#065f46' : '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {summaryData.labaBersih >= 0 ? '✨ Laba Bersih Riil' : '⚠️ Defisit Bersih'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: summaryData.labaBersih >= 0 ? '#059669' : '#dc2626', marginTop: '6px' }}>
              {formatRupiah(summaryData.labaBersih)}
            </div>
            <div style={{ fontSize: '12px', color: summaryData.labaBersih >= 0 ? '#047857' : '#b91c1c', marginTop: '4px', fontWeight: 600 }}>
              {summaryData.labaBersih >= 0 ? 'Keuntungan murni masuk kantong' : 'Belum menutup beban operasional'}
            </div>
          </div>
        </div>
      )}

      {/* Operasional Expenses Table with Edit and Delete */}
      <div className="clean-card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Catatan Biaya Operasional Toko / Lapak
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Biaya sewa otomatis dikonversi ke beban harian untuk perhitungan laba rugi yang adil.
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            {expenses.length} entri tercatat
          </span>
        </div>

        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '13px' }}>
            Belum ada pengeluaran operasional dicatat. Klik "+ Catat Biaya Operasional" di atas.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px', fontWeight: 700 }}>Jenis Biaya</th>
                  <th style={{ padding: '12px', fontWeight: 700 }}>Deskripsi</th>
                  <th style={{ padding: '12px', fontWeight: 700 }}>Periode Bayar</th>
                  <th style={{ padding: '12px', fontWeight: 700 }}>Tanggal Mulai</th>
                  <th style={{ padding: '12px', fontWeight: 700, textAlign: 'right' }}>Nominal Asli</th>
                  <th style={{ padding: '12px', fontWeight: 700, textAlign: 'right' }}>Konversi Beban Harian</th>
                  <th style={{ padding: '12px', fontWeight: 700, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  const dailyRate = calcDailyRent(exp.nominal, exp.periode);
                  return (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: exp.jenis === 'sewa_tempat' ? '#f0fdf4' : exp.jenis === 'transportasi' ? '#fff7ed' : '#f8fafc',
                            color: exp.jenis === 'sewa_tempat' ? '#15803d' : exp.jenis === 'transportasi' ? '#c2410c' : '#475569',
                            textTransform: 'uppercase',
                          }}
                        >
                          {exp.jenis === 'sewa_tempat' ? 'Sewa Tempat' : exp.jenis === 'transportasi' ? 'Transport' : 'Lainnya'}
                        </span>
                      </td>

                      <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                        {exp.deskripsi}
                      </td>

                      <td style={{ padding: '12px', color: '#64748b', textTransform: 'capitalize' }}>
                        {exp.periode.replace('_', ' ')}
                      </td>

                      <td style={{ padding: '12px', color: '#475569', fontWeight: 500 }}>
                        {formatTanggalIndo(exp.tanggal_mulai)}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatRupiah(exp.nominal)}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: exp.jenis === 'sewa_tempat' ? '#059669' : '#64748b' }}>
                        {exp.jenis === 'sewa_tempat' ? `${formatRupiah(dailyRate)} / hari` : '- (Sekali bayar)'}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(exp)}
                            title="Edit Catatan Biaya"
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id, exp.deskripsi)}
                            title="Hapus Catatan Biaya"
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Expense */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {editingExpense ? 'Edit Pengeluaran Operasional' : 'Catat Biaya Operasional Toko'}
              </h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Jenis Pengeluaran *
                </label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as any)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                >
                  <option value="sewa_tempat">Sewa Tempat (Mall, Ruko, Lapak Bazar)</option>
                  <option value="transportasi">Transportasi / Logistik Pick-up</option>
                  <option value="lainnya">Lainnya (Kantong Plastik, Hanger, Tim)</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Deskripsi Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sewa Lapak Mall Detos"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Nominal Biaya (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="3000000"
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Periode Pembayaran *
                  </label>
                  <select
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  >
                    <option value="harian">Harian</option>
                    <option value="bulanan">Bulanan (30 hari)</option>
                    <option value="3_bulan">3 Bulan (90 hari)</option>
                    <option value="6_bulan">6 Bulan (180 hari)</option>
                    <option value="tahunan">Tahunan (365 hari)</option>
                    <option value="sekali">Sekali Bayar</option>
                  </select>
                </div>
              </div>

              {/* Live Daily Conversion Preview for Sewa */}
              {jenis === 'sewa_tempat' && Number(nominal) > 0 && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                    💡 Estimasi Beban Harian:
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    {formatRupiah(previewDailyRate)} <span style={{ fontSize: '12px', fontWeight: 500 }}>/ hari</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#065f46', marginTop: '2px' }}>
                    Laba bersih harian Anda akan dikurangi {formatRupiah(previewDailyRate)} per hari secara adil.
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Tanggal Mulai Berlaku *
                </label>
                <input
                  type="date"
                  required
                  value={tglMulai}
                  onChange={(e) => setTglMulai(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '11px', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1.5, background: '#059669', border: 'none', borderRadius: '8px', padding: '11px', fontWeight: 700, cursor: 'pointer', color: '#ffffff' }}
                >
                  {submitting ? 'Menyimpan...' : editingExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
