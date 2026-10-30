'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/calc';
import { CartItem, calculateCartTotals, validateCartBeforeCheckout } from '../lib/cart';
import { DEFAULT_PRICE_PRESETS } from '../lib/constants';
import CashModal from './CashModal';
import QrisModal from './QrisModal';
import {
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  RotateCcw,
  Tag,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PosCashier: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [diskon, setDiskon] = useState<number>(0);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showCashModal, setShowCashModal] = useState<boolean>(false);
  const [showQrisModal, setShowQrisModal] = useState<boolean>(false);
  const [lastSuccessTrans, setLastSuccessTrans] = useState<any | null>(null);

  const { subtotal, total, total_pcs } = calculateCartTotals(items, diskon);
  const { valid, reason } = validateCartBeforeCheckout(items, diskon);

  const handleAddPreset = (nominal: number, label: string) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.harga_satuan === nominal);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].qty += 1;
        return next;
      }
      return [...prev, { harga_satuan: nominal, qty: 1, label }];
    });
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const newQty = next[index].qty + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index].qty = newQty;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetCart = () => {
    if (items.length > 0 && confirm('Kosongkan semua barang di keranjang?')) {
      setItems([]);
      setDiskon(0);
    }
  };

  const handleAddCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(customPrice.replace(/\D/g, ''), 10);
    if (!priceNum || priceNum <= 0) return;

    handleAddPreset(priceNum, customLabel.trim() || 'Item Spesial');
    setCustomPrice('');
    setCustomLabel('');
    setShowCustomModal(false);
  };

  const handleCashSuccess = async (uangDiterima: number, kembalian: number) => {
    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metode_bayar: 'tunai',
          subtotal,
          diskon,
          total,
          total_pcs,
          status_pembayaran: 'settlement',
          items,
        }),
      });

      const data = await res.json();
      setShowCashModal(false);
      setItems([]);
      setDiskon(0);
      setLastSuccessTrans({
        ...data.transaction,
        uangDiterima,
        kembalian,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      alert('Gagal mencatat transaksi: ' + err);
    }
  };

  const handleQrisSuccess = (transaction: any) => {
    setShowQrisModal(false);
    setItems([]);
    setDiskon(0);
    setLastSuccessTrans(transaction);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="page-container">
      {/* Top Banner */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Kasir Cepat Lapak
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Tap tier harga sesuai rak baju lalu atur jumlah item belanjaan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className="btn btn-outline"
          style={{ fontSize: '13px', gap: '6px' }}
        >
          <Plus size={16} />
          <span>+ Input Harga Manual</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Price Buttons Grid */}
        <div>
          <div style={{ marginBottom: '14px', fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pilih Tag Harga Baju
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {DEFAULT_PRICE_PRESETS.map((preset) => (
              <button
                key={preset.nominal}
                type="button"
                onClick={() => handleAddPreset(preset.nominal, preset.label)}
                className="clean-card"
                style={{
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: '1px solid #e2e8f0',
                  padding: '16px 14px',
                  borderRadius: '12px',
                  transition: 'all 0.15s ease',
                  background: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(16, 185, 129, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  {preset.label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  {formatRupiah(preset.nominal)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                  <Plus size={12} strokeWidth={3} /> Tambah ke keranjang
                </div>
              </button>
            ))}
          </div>

          {/* Quick instructions alert */}
          <div style={{ marginTop: '20px', padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            💡 <strong>Tips Lapak:</strong> Klik tombol harga berulang kali untuk menambah kuantitas secara instan, atau sesuaikan jumlahnya langsung pada daftar keranjang di sebelah kanan.
          </div>
        </div>

        {/* Right Column: Active Cart & Total */}
        <div>
          <div className="clean-card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color="#059669" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Keranjang Belanja</h3>
                <span style={{ fontSize: '12px', fontWeight: 700, background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px', color: '#475569' }}>
                  {total_pcs} pcs
                </span>
              </div>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetCart}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div style={{ minHeight: '180px', maxHeight: '320px', overflowY: 'auto', padding: '12px 0' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                  <Tag size={36} strokeWidth={1.5} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>Belum ada item dipilih</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Tap salah satu tombol harga di sebelah kiri</p>
                </div>
              ) : (
                items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {formatRupiah(it.harga_satuan)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {it.label || 'Item'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Qty controller */}
                      <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '2px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -1)}
                          style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                          {it.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, 1)}
                          style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Subtotal per row */}
                      <div style={{ minWidth: '85px', textAlign: 'right', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {formatRupiah(it.harga_satuan * it.qty)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Subtotal, Discount & Total Calculation */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                <span>Subtotal ({total_pcs} pcs)</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatRupiah(subtotal)}</span>
              </div>

              {/* Discount Input */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Potongan Diskon (Rp)</span>
                <input
                  type="number"
                  value={diskon || ''}
                  onChange={(e) => setDiskon(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  style={{
                    width: '120px',
                    padding: '6px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    textAlign: 'right',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Grand Total Box */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Pembayaran
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginTop: '2px' }}>
                  {formatRupiah(total)}
                </div>
                {diskon > 0 && (
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                    Hemat {formatRupiah(diskon)}
                  </div>
                )}
              </div>

              {/* Checkout Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-violet"
                  disabled={!valid}
                  onClick={() => setShowQrisModal(true)}
                  style={{ fontSize: '15px', fontWeight: 700, padding: '14px' }}
                >
                  <QrCode size={20} />
                  <span>Bayar via QRIS Dinamis</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={!valid}
                  onClick={() => setShowCashModal(true)}
                  style={{ fontSize: '14px', fontWeight: 600 }}
                >
                  <Banknote size={18} color="#059669" />
                  <span>Bayar Tunai (Cash)</span>
                </button>
              </div>

              {!valid && items.length > 0 && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', textAlign: 'center', fontWeight: 500 }}>
                  ⚠️ {reason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Price Modal */}
      {showCustomModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
              Input Nominal Harga Kustom
            </h3>
            <form onSubmit={handleAddCustomPrice}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Nominal Harga (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 85000"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '16px', fontWeight: 700, borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Deskripsi / Tag Barang (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jaket Denim Levi's"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowCustomModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-emerald"
                  style={{ flex: 1.5 }}
                >
                  Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Modal */}
      <CashModal
        isOpen={showCashModal}
        total={total}
        onClose={() => setShowCashModal(false)}
        onSuccess={handleCashSuccess}
      />

      {/* QRIS Modal */}
      <QrisModal
        isOpen={showQrisModal}
        total={total}
        subtotal={subtotal}
        diskon={diskon}
        totalPcs={total_pcs}
        items={items}
        onClose={() => setShowQrisModal(false)}
        onSuccess={handleQrisSuccess}
      />

      {/* Success Transaction Toast / Modal */}
      {lastSuccessTrans && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', textAlign: 'center', maxWidth: '420px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              Transaksi Berhasil!
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              ID: {lastSuccessTrans.order_id}
            </p>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                <span>Metode Pembayaran:</span>
                <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>{lastSuccessTrans.metode_bayar}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                <span>Total Barang:</span>
                <strong style={{ color: '#0f172a' }}>{lastSuccessTrans.total_pcs} pcs</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#0f172a', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600 }}>Total Dibayar:</span>
                <strong style={{ color: '#059669', fontWeight: 800 }}>{formatRupiah(lastSuccessTrans.total)}</strong>
              </div>
              {lastSuccessTrans.kembalian !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                  <span>Kembalian:</span>
                  <strong style={{ color: '#0f172a' }}>{formatRupiah(lastSuccessTrans.kembalian)}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-emerald"
              style={{ width: '100%', fontSize: '15px' }}
              onClick={() => setLastSuccessTrans(null)}
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosCashier;
