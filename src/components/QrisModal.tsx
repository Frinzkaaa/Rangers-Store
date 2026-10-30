'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/calc';
import { CartItem } from '../lib/cart';
import { QrCode, X, CheckCircle, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

interface QrisModalProps {
  isOpen: boolean;
  total: number;
  subtotal: number;
  diskon: number;
  totalPcs: number;
  customerName?: string;
  items: CartItem[];
  onClose: () => void;
  onSuccess: (transaction: any) => void;
}

export const QrisModal: React.FC<QrisModalProps> = ({
  isOpen,
  total,
  subtotal,
  diskon,
  totalPcs,
  customerName,
  items,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [orderId, setOrderId] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [checking, setChecking] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('Menunggu scan dari pembeli...');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setStatusMsg('Menghubungkan ke Midtrans Sandbox...');
      fetch('/api/midtrans/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtotal,
          diskon,
          total,
          total_pcs: totalPcs,
          customer_name: customerName || 'Pelanggan',
          items,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOrderId(data.order_id);
            setQrUrl(data.qr_url);
            setStatusMsg('QRIS siap di-scan pembeli');
          } else {
            setStatusMsg('Gagal generate QRIS: ' + data.error);
          }
          setLoading(false);
        })
        .catch((err) => {
          setStatusMsg('Error generate QRIS: ' + err);
          setLoading(false);
        });
    }
  }, [isOpen, total, subtotal, diskon, totalPcs]);

  if (!isOpen) return null;

  const handleCheckStatus = async () => {
    if (!orderId) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/midtrans/status?order_id=${orderId}`);
      const data = await res.json();
      if (data.status === 'settlement') {
        setStatusMsg('Pembayaran Lunas Terkonfirmasi!');
        onSuccess(data.transaction);
      } else {
        setStatusMsg(`Status: ${data.status} (Belum dibayar)`);
      }
    } catch (err) {
      setStatusMsg('Gagal cek status: ' + err);
    } finally {
      setChecking(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!orderId) return;
    setChecking(true);
    try {
      const res = await fetch('/api/midtrans/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, action: 'simulate_settlement' }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.transaction);
      }
    } catch (err) {
      alert('Simulasi gagal: ' + err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '26px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <QrCode size={20} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>QRIS Dinamis</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Locked Amount Badge */}
        <div
          style={{
            background: '#eff6ff',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid #bfdbfe',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <ShieldCheck size={14} />
            <span>Nominal Terkunci Otomatis</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#1e3a8a', marginTop: '2px', letterSpacing: '-0.02em' }}>
            {formatRupiah(total)}
          </div>
          <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>
            Total keranjang terkunci — pembeli tidak bisa salah ketik nominal
          </div>
        </div>

        {/* QR Code Container */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '20px',
            border: '2px dashed #cbd5e1',
            display: 'inline-block',
            marginBottom: '16px',
            minWidth: '220px',
            minHeight: '220px',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b', gap: '10px' }}>
              <RefreshCw size={28} className="animate-spin" color="#2563eb" />
              <span style={{ fontSize: '13px' }}>Membuat QRIS Dinamis...</span>
            </div>
          ) : qrUrl ? (
            <div>
              <img
                src={qrUrl}
                alt="QRIS Midtrans"
                style={{ width: '200px', height: '200px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
              />
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontWeight: 500 }}>
                Scan via GoPay, BCA, Mandiri, ShopeePay, Dana, dll
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px 10px', color: '#ef4444', fontSize: '13px' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 8px' }} />
              QRIS tidak dapat dimuat
            </div>
          )}
        </div>

        {/* Order ID & Status */}
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>Order ID: <strong style={{ color: '#1e293b' }}>{orderId || '-'}</strong></div>
          <div style={{ marginTop: '2px', color: '#059669', fontWeight: 600 }}>{statusMsg}</div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            disabled={loading || checking}
            onClick={handleSimulatePayment}
            style={{
              width: '100%',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <CheckCircle size={16} />
            <span>Simulasi Pembayaran Berhasil</span>
          </button>

          <button
            type="button"
            disabled={loading || checking}
            onClick={handleCheckStatus}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            <span>Cek Status Pembayaran</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrisModal;
