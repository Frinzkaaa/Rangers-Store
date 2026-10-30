'use client';

import React, { useState } from 'react';
import { formatRupiah } from '../lib/calc';
import { calculateChange } from '../lib/cart';
import { Banknote, X, CheckCircle, AlertCircle } from 'lucide-react';

interface CashModalProps {
  total: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (uangDiterima: number, kembalian: number) => void;
}

export const CashModal: React.FC<CashModalProps> = ({ total, isOpen, onClose, onSuccess }) => {
  const [uangDiterima, setUangDiterima] = useState<number>(total);

  React.useEffect(() => {
    if (isOpen) {
      setUangDiterima(total);
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const { kembalian, isEnough } = calculateChange(total, uangDiterima);

  const quickAmounts = [
    total,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i && v >= total);

  if (!quickAmounts.includes(100000) && total < 100000) quickAmounts.push(100000);
  if (!quickAmounts.includes(200000) && total < 200000) quickAmounts.push(200000);
  quickAmounts.sort((a, b) => a - b);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <Banknote size={20} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Pembayaran Tunai</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Tagihan
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#1e293b', marginTop: '2px', letterSpacing: '-0.02em' }}>
            {formatRupiah(total)}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
            Uang Tunai Diterima (Rp)
          </label>
          <input
            type="number"
            value={uangDiterima || ''}
            onChange={(e) => setUangDiterima(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '18px',
              fontWeight: 700,
              borderRadius: '14px',
              border: '2px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="0"
          />
        </div>

        {/* Quick Cash Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setUangDiterima(amt)}
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                borderRadius: '999px',
                border: `1px solid ${uangDiterima === amt ? '#2563eb' : '#e2e8f0'}`,
                background: uangDiterima === amt ? '#eff6ff' : '#ffffff',
                color: uangDiterima === amt ? '#2563eb' : '#475569',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {amt === total ? 'Uang Pas' : formatRupiah(amt)}
            </button>
          ))}
        </div>

        {/* Change status box */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isEnough ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${isEnough ? '#a7f3d0' : '#fecaca'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEnough ? <CheckCircle size={18} color="#059669" /> : <AlertCircle size={18} color="#ef4444" />}
            <span style={{ fontSize: '13px', fontWeight: 600, color: isEnough ? '#065f46' : '#991b1b' }}>
              {isEnough ? 'Kembalian:' : 'Uang Kurang:'}
            </span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: isEnough ? '#059669' : '#dc2626' }}>
            {formatRupiah(Math.abs(kembalian))}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!isEnough}
            onClick={() => onSuccess(uangDiterima, kembalian)}
            style={{
              flex: 2,
              background: isEnough ? '#059669' : '#94a3b8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              fontWeight: 700,
              cursor: isEnough ? 'pointer' : 'not-allowed',
              boxShadow: isEnough ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'none',
            }}
          >
            Selesaikan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashModal;
