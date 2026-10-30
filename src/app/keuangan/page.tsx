'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../../lib/calc';
import { Expense } from '../../lib/db';
import {
  CircleDollarSign,
  TrendingUp,
  Receipt,
  FileText,
  Plus,
  Calendar,
  Building,
  Truck,
  Download,
  X,
  AlertCircle,
} from 'lucide-react';

export default function KeuanganPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);

  // Date filters (defaults to last 30 days)
  const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const defaultEnd = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

  // Expense Form
  const [jenis, setJenis] = useState<'sewa_tempat' | 'transportasi' | 'lainnya'>('sewa_tempat');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [nominal, setNominal] = useState<string>('');
  const [periode, setPeriode] = useState<string>('bulanan');
  const [tglMulai, setTglMulai] = useState<string>(defaultEnd);
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

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
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
        setDeskripsi('');
        setNominal('');
        fetchData();
      } else {
        alert(data.error || 'Gagal menyimpan pengeluaran');
      }
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/laporan/pdf?start=${startDate}&end=${endDate}`, '_blank');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Laporan Keuangan & Laba Bersih
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Perhitungan omzet, modal bal terjual, biaya sewa harian, transport bazar, dan estimasi laba bersih riil.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowExpenseModal(true)}
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
          <span>Filter Rentang Periode Laporan:</span>
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

      {/* Financial Metric Cards */}
      {summaryData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Omzet */}
          <div className="clean-card">
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Omzet Penjualan
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              {formatRupiah(summaryData.totalOmzet)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {summaryData.totalPcs} pcs ({summaryData.totalTransaksi} transaksi)
            </div>
          </div>

          {/* Modal Terjual */}
          <div className="clean-card">
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Modal Bal (HPP)
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#64748b', marginTop: '6px' }}>
              {formatRupiah(summaryData.totalCogs)}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Modal per item dari batch aktif
            </div>
          </div>

          {/* Laba Kotor */}
          <div className="clean-card">
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estimasi Laba Kotor
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
              {formatRupiah(summaryData.labaKotor)}
            </div>
            <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px' }}>
              Omzet minus Modal Terjual
            </div>
          </div>

          {/* Beban Operasional */}
          <div className="clean-card">
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Biaya Sewa & Transport
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
              {formatRupiah(summaryData.totalOperasional)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Sewa {formatRupiah(summaryData.totalRentCost)} + Transport {formatRupiah(summaryData.totalTransportCost)}
            </div>
          </div>

          {/* Laba Bersih Highlight Card */}
          <div className="clean-card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🎉 Laba Bersih Riil
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
              {formatRupiah(summaryData.labaBersih)}
            </div>
            <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px', fontWeight: 600 }}>
              Keuntungan murni masuk kantong
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Operasional Expenses Table */}
      <div className="clean-card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Catatan Biaya Operasional Toko / Lapak
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {expenses.length} entri tercatat
          </span>
        </div>

        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '13px' }}>
            Belum ada pengeluaran operasional dicatat.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Jenis</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Deskripsi</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Periode</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Tanggal Mulai</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Nominal Biaya</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: exp.jenis === 'sewa_tempat' ? '#f0fdf4' : '#fff7ed',
                          color: exp.jenis === 'sewa_tempat' ? '#15803d' : '#c2410c',
                          textTransform: 'uppercase',
                        }}
                      >
                        {exp.jenis === 'sewa_tempat' ? 'Sewa Tempat' : exp.jenis === 'transportasi' ? 'Transport' : 'Lainnya'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>{exp.deskripsi}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{exp.periode}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{exp.tanggal_mulai}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {formatRupiah(exp.nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Expense */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Catat Pengeluaran Operasional
              </h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Jenis Pengeluaran
                </label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as any)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                >
                  <option value="sewa_tempat">Sewa Tempat (Booth Mall / Lapak Bazar)</option>
                  <option value="transportasi">Transportasi (Loading Barang / Sewa Mobil)</option>
                  <option value="lainnya">Lain-lain</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Deskripsi Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sewa Lapak Bazar Sarinah 3 Hari"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Nominal Biaya (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1500000"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Periode Biaya
                  </label>
                  <select
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  >
                    <option value="sekali">Sekali (Event/Bazar)</option>
                    <option value="harian">Harian</option>
                    <option value="bulanan">Bulanan</option>
                    <option value="3_bulan">3 Bulan</option>
                    <option value="tahunan">Tahunan</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={tglMulai}
                    onChange={(e) => setTglMulai(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowExpenseModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-emerald"
                  style={{ flex: 1.5 }}
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Biaya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
