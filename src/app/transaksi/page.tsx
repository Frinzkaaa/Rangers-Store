'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah, formatWaktuIndo } from '../../lib/calc';
import { Transaction } from '../../lib/db';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
  QrCode,
  Landmark,
  Eye,
  Trash2,
  Printer,
  X,
  ShoppingBag,
} from 'lucide-react';

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = () => {
    setLoading(true);
    fetch('/api/transaksi')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTransactions(data.transactions);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleCancelTransaction = async (id: number, orderId: string) => {
    if (!confirm(`Yakin ingin membatalkan transaksi ${orderId}?\nStok pakaian akan otomatis dikembalikan ke batch bal.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/transaksi?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert('Transaksi berhasil dibatalkan dan stok dikembalikan.');
        fetchTransactions();
        if (selectedTransaction?.id === id) {
          setSelectedTransaction(null);
        }
      } else {
        alert(data.error || 'Gagal membatalkan transaksi');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  // Filter transactions
  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.items && t.items.some((it: any) => String(it.harga_satuan).includes(searchQuery)));

    const matchStatus = statusFilter === 'all' || t.status_pembayaran === statusFilter;
    const matchPayment = paymentFilter === 'all' || t.metode_bayar === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  });

  const totalOmzetSettled = transactions
    .filter((t) => t.status_pembayaran === 'settlement')
    .reduce((acc, t) => acc + t.total, 0);

  const totalPcsSettled = transactions
    .filter((t) => t.status_pembayaran === 'settlement')
    .reduce((acc, t) => acc + t.total_pcs, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settlement':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            <CheckCircle size={12} />
            <span>Lunas</span>
          </span>
        );
      case 'pending':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
      case 'cancel':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            <XCircle size={12} />
            <span>Dibatalkan</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case 'tunai':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            <Banknote size={12} />
            <span>Tunai</span>
          </span>
        );
      case 'qris':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            <QrCode size={12} />
            <span>QRIS</span>
          </span>
        );
      case 'transfer':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#faf5ff', color: '#7c3aed', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            <Landmark size={12} />
            <span>Transfer</span>
          </span>
        );
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Riwayat Transaksi Penjualan
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Data lengkap transaksi kasir, nama pembeli, rincian pakaian, status pembayaran, dan nota struk.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="clean-card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Total Transaksi Lunas
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {transactions.filter((t) => t.status_pembayaran === 'settlement').length}{' '}
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>/ {transactions.length} total</span>
          </div>
        </div>

        <div className="clean-card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Total Omzet Terkumpul
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
            {formatRupiah(totalOmzetSettled)}
          </div>
        </div>

        <div className="clean-card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Total Pakaian Terjual
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2563eb', marginTop: '6px' }}>
            {totalPcsSettled}{' '}
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>pcs</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="clean-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <input
              type="text"
              placeholder="Cari No. Order atau Nama Pembeli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          </div>

          {/* Payment Method Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Metode:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
            >
              <option value="all">Semua Metode</option>
              <option value="tunai">Tunai (Cash)</option>
              <option value="qris">QRIS Dinamis</option>
              <option value="transfer">Transfer Bank</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
            >
              <option value="all">Semua Status</option>
              <option value="settlement">Lunas (Settlement)</option>
              <option value="pending">Pending</option>
              <option value="cancel">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="clean-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            Memuat riwayat transaksi...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <ShoppingBag size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#475569' }}>
              Tidak ada transaksi ditemukan
            </h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Lakukan penjualan di menu Kasir POS untuk mencatat transaksi.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>No. Order / Waktu</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>Nama Pembeli</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>Rincian Barang</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>Metode Bayar</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Total Tagihan</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.order_id}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {formatWaktuIndo(t.created_at)}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {t.customer_name || 'Pelanggan'}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {t.items && t.items.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {t.items.map((it, idx) => (
                            <span key={idx} style={{ fontSize: '12px', color: '#334155' }}>
                              • {it.qty}x item ({formatRupiah(it.harga_satuan)})
                            </span>
                          ))}
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
                            Total: {t.total_pcs} pcs
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {t.total_pcs} pcs pakaian
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {getPaymentBadge(t.metode_bayar)}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                      {formatRupiah(t.total)}
                      {t.diskon > 0 && (
                        <div style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>
                          Diskon -{formatRupiah(t.diskon)}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {getStatusBadge(t.status_pembayaran)}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedTransaction(t)}
                          title="Lihat Struk Transaksi"
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#2563eb',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={13} />
                          <span>Struk</span>
                        </button>

                        {t.status_pembayaran !== 'cancel' && (
                          <button
                            type="button"
                            onClick={() => handleCancelTransaction(t.id, t.order_id)}
                            title="Batalkan Transaksi (Kembalikan Stok)"
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              padding: '6px 8px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Struk Modal */}
      {selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Nota Struk Belanja
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Rangers Store • POS Thrifting</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt Box */}
            <div
              style={{
                background: '#f8fafc',
                padding: '18px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                margin: '16px 0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                <span>No. Order:</span>
                <strong style={{ color: '#0f172a' }}>{selectedTransaction.order_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                <span>Waktu:</span>
                <strong style={{ color: '#0f172a' }}>{formatWaktuIndo(selectedTransaction.created_at)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                <span>Nama Pembeli:</span>
                <strong style={{ color: '#0f172a' }}>{selectedTransaction.customer_name || 'Pelanggan'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                <span>Metode Pembayaran:</span>
                <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>{selectedTransaction.metode_bayar}</strong>
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Daftar Pakaian Dibeli:
                </div>
                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                  selectedTransaction.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Item @{formatRupiah(it.harga_satuan)} x {it.qty}</span>
                      <strong>{formatRupiah(it.subtotal || it.harga_satuan * it.qty)}</strong>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {selectedTransaction.total_pcs} pcs pakaian
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                  <span>Subtotal:</span>
                  <strong>{formatRupiah(selectedTransaction.subtotal || selectedTransaction.total)}</strong>
                </div>
                {selectedTransaction.diskon > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#059669', marginBottom: '4px' }}>
                    <span>Diskon:</span>
                    <strong>-{formatRupiah(selectedTransaction.diskon)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#0f172a', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 700 }}>Total Tagihan:</span>
                  <strong style={{ color: '#2563eb', fontWeight: 900 }}>{formatRupiah(selectedTransaction.total)}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '11px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={15} />
                <span>Cetak Struk</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                style={{
                  flex: 1,
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '11px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#ffffff',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
