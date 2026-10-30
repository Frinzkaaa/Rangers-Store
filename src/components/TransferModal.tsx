'use client';

import React, { useState } from 'react';
import { formatRupiah } from '../lib/calc';
import { Landmark, X, CheckCircle, Copy, Check } from 'lucide-react';

interface TransferModalProps {
  total: number;
  totalPcs: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (catatan?: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  total,
  totalPcs,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [catatan, setCatatan] = useState<string>('');

  if (!isOpen) return null;

  const norek = '8015 2938 1024';
  const bankName = 'BCA - Bank Central Asia';
  const atasNama = 'Rangers Store / Frinzka';

  const handleCopyNorek = () => {
    navigator.clipboard.writeText(norek.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '26px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
              }}
            >
              <Landmark size={20} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
              Transfer Bank
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Total Tagihan Box */}
        <div
          style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            marginBottom: '18px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Tagihan ({totalPcs} pcs)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#1e293b', marginTop: '2px', letterSpacing: '-0.02em' }}>
            {formatRupiah(total)}
          </div>
        </div>

        {/* Info Rekening Box */}
        <div
          style={{
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '16px',
            padding: '14px 16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Rekening Toko
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#4c1d95', letterSpacing: '0.04em' }}>
                {norek}
              </div>
              <div style={{ fontSize: '12px', color: '#6b21a8', marginTop: '2px' }}>
                {bankName} a.n {atasNama}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyNorek}
              style={{
                background: copied ? '#059669' : '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>

        {/* Catatan / Nama Pengirim Opsional */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
            Nama Pengirim / Referensi (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: BCA Bpk. Ahmad"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '13px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Actions */}
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
            onClick={() => onSuccess(catatan.trim() || undefined)}
            style={{
              flex: 1.5,
              background: '#7c3aed',
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}
          >
            <CheckCircle size={16} />
            <span>Konfirmasi Transfer Masuk</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
