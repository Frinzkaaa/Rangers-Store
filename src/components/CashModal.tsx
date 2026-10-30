'use client';

import React, { useState } from 'react';
import { formatRupiah, calcNetProfit } from '../lib/calc';
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

  if (!isOpen) return null;

  const { kembalian, isEnough } = calculateChange(total, uangDiterima);

  // Quick cash buttons
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
      <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Banknote size={24} color="#059669" />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Pembayaran Tunai</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Total Tagihan</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {formatRupiah(total)}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
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
              borderRadius: '8px',
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
              className="btn btn-outline"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                minHeight: '34px',
                background: uangDiterima === amt ? '#ecfdf5' : 'white',
                borderColor: uangDiterima === amt ? '#059669' : '#e2e8f0',
                color: uangDiterima === amt ? '#059669' : '#334155',
                fontWeight: 600,
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
            borderRadius: '10px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isEnough ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${isEnough ? '#a7f3d0' : '#fecaca'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEnough ? <CheckCircle size={20} color="#059669" /> : <AlertCircle size={20} color="#ef4444" />}
            <span style={{ fontSize: '14px', fontWeight: 600, color: isEnough ? '#065f46' : '#991b1b' }}>
              {isEnough ? 'Kembalian:' : 'Uang Kurang:'}
            </span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: isEnough ? '#059669' : '#dc2626' }}>
            {formatRupiah(Math.abs(kembalian))}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-emerald"
            style={{ flex: 2 }}
            disabled={!isEnough}
            onClick={() => onSuccess(uangDiterima, kembalian)}
          >
            Selesaikan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashModal;
