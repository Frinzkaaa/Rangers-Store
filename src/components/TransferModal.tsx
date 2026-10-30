'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/calc';
import { CartItem } from '../lib/cart';
import { SupportedBank } from '../lib/midtrans';
import {
  Landmark,
  X,
  CheckCircle,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TransferModalProps {
  total: number;
  subtotal: number;
  diskon: number;
  totalPcs: number;
  customerName?: string;
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transaction: any) => void;
}

interface BankOption {
  id: SupportedBank;
  name: string;
  fullName: string;
  badgeColor: string;
  badgeBg: string;
}

const BANKS: BankOption[] = [
  { id: 'bca', name: 'BCA', fullName: 'BCA Virtual Account', badgeColor: '#0060af', badgeBg: '#eff6ff' },
  { id: 'mandiri', name: 'Mandiri', fullName: 'Mandiri Bill Payment', badgeColor: '#003d79', badgeBg: '#f0f7ff' },
  { id: 'bni', name: 'BNI', fullName: 'BNI Virtual Account', badgeColor: '#005e6a', badgeBg: '#f0fdfa' },
  { id: 'bri', name: 'BRI', fullName: 'BRI Virtual Account (BRIVA)', badgeColor: '#00529c', badgeBg: '#eff6ff' },
  { id: 'permata', name: 'Permata', fullName: 'Permata Virtual Account', badgeColor: '#008253', badgeBg: '#ecfdf5' },
];

export const TransferModal: React.FC<TransferModalProps> = ({
  total,
  subtotal,
  diskon,
  totalPcs,
  customerName,
  items,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedBank, setSelectedBank] = useState<SupportedBank>('bca');
  const [loading, setLoading] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>('');
  const [vaNumber, setVaNumber] = useState<string>('');
  const [billKey, setBillKey] = useState<string>('');
  const [billerCode, setBillerCode] = useState<string>('');
  const [expiryTime, setExpiryTime] = useState<string>('');
  const [simulatorUrl, setSimulatorUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('Menunggu transfer...');
  const [copiedVa, setCopiedVa] = useState<boolean>(false);
  const [copiedBillKey, setCopiedBillKey] = useState<boolean>(false);
  const [copiedBillerCode, setCopiedBillerCode] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [instructionTab, setInstructionTab] = useState<'mbanking' | 'atm' | 'ibanking'>('mbanking');

  // Trigger Midtrans VA charge whenever modal opens or bank is switched
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Membuat Virtual Account Midtrans...');

    fetch('/api/midtrans/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_type: 'bank_transfer',
        bank: selectedBank,
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
        if (!isMounted) return;
        if (data.success) {
          setOrderId(data.order_id);
          setVaNumber(data.va_number || '');
          setBillKey(data.bill_key || '');
          setBillerCode(data.biller_code || '');
          setExpiryTime(data.expiry_time || '');
          setSimulatorUrl(data.simulator_url || '');
          setStatusMsg('Virtual Account siap menerima pembayaran');
        } else {
          setErrorMsg(data.error || 'Gagal memproses VA ke Midtrans');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMsg('Error koneksi Midtrans: ' + String(err));
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedBank, total, subtotal, diskon, totalPcs]);

  // Polling check status every 4 seconds while modal is open and orderId exists
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/midtrans/status?order_id=${orderId}`);
        const data = await res.json();
        if (data.status === 'settlement') {
          clearInterval(interval);
          setStatusMsg('Pembayaran Transfer Terkonfirmasi!');
          onSuccess(data.transaction);
        }
      } catch (err) {
        // silent polling catch
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, orderId, onSuccess]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'va' | 'billkey' | 'billercode') => {
    navigator.clipboard.writeText(text);
    if (type === 'va') {
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    } else if (type === 'billkey') {
      setCopiedBillKey(true);
      setTimeout(() => setCopiedBillKey(false), 2000);
    } else {
      setCopiedBillerCode(true);
      setTimeout(() => setCopiedBillerCode(false), 2000);
    }
  };

  const handleCheckStatus = async () => {
    if (!orderId) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/midtrans/status?order_id=${orderId}`);
      const data = await res.json();
      if (data.status === 'settlement') {
        setStatusMsg('Pembayaran Transfer Terkonfirmasi!');
        onSuccess(data.transaction);
      } else {
        setStatusMsg(`Status: ${data.status} (Belum ada dana masuk)`);
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

  const currentBankObj = BANKS.find((b) => b.id === selectedBank) || BANKS[0];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: currentBankObj.badgeBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentBankObj.badgeColor,
              }}
            >
              <Landmark size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                Transfer Midtrans
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Virtual Account Otomatis Terverifikasi</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Bank Selector Chips */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Pilih Bank Tujuan:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {BANKS.map((b) => {
              const active = b.id === selectedBank;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    if (selectedBank !== b.id) {
                      setSelectedBank(b.id);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: active ? `2px solid ${b.badgeColor}` : '1px solid #e2e8f0',
                    background: active ? b.badgeBg : '#ffffff',
                    color: active ? b.badgeColor : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Total Tagihan Box */}
        <div
          style={{
            background: '#f8fafc',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>Nominal Tagihan Terkunci ({totalPcs} pcs)</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', marginTop: '2px', letterSpacing: '-0.02em' }}>
            {formatRupiah(total)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Order ID: <strong>{orderId || '...'}</strong>
          </div>
        </div>

        {/* VA Number / Details Box */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #cbd5e1',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: '10px' }}>
              <RefreshCw size={24} className="animate-spin" color={currentBankObj.badgeColor} />
              <span style={{ fontSize: '12px', color: '#64748b' }}>Menghubungkan Midtrans Core API...</span>
            </div>
          ) : errorMsg ? (
            <div style={{ color: '#ef4444', textAlign: 'center', padding: '16px' }}>
              <AlertCircle size={28} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{errorMsg}</div>
            </div>
          ) : selectedBank === 'mandiri' ? (
            /* Mandiri Bill Payment has Biller Code + Bill Key */
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                {currentBankObj.fullName}
              </div>

              {/* Biller Code */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>KODE PERUSAHAAN (BILLER)</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', letterSpacing: '0.04em' }}>{billerCode || '70012'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(billerCode || '70012', 'billercode')}
                  style={{
                    background: copiedBillerCode ? '#059669' : '#003d79',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedBillerCode ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedBillerCode ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              {/* Bill Key */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>NOMOR PELANGGAN / BILL KEY</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#003d79', letterSpacing: '0.04em' }}>{billKey}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(billKey, 'billkey')}
                  style={{
                    background: copiedBillKey ? '#059669' : '#003d79',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedBillKey ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedBillKey ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* BCA, BNI, BRI, Permata VA */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  {currentBankObj.fullName}
                </span>
                {expiryTime && (
                  <span style={{ fontSize: '10px', color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>
                    Batas 24 Jam
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: currentBankObj.badgeColor, letterSpacing: '0.06em' }}>
                    {vaNumber || '...'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    a.n Rangers Store / Midtrans
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(vaNumber, 'va')}
                  style={{
                    background: copiedVa ? '#059669' : currentBankObj.badgeColor,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {copiedVa ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedVa ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Status badge */}
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>{statusMsg}</span>
          </div>
        </div>

        {/* Accordion Cara Pembayaran */}
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <span>Petunjuk Cara Pembayaran</span>
            {showInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showInstructions && (
            <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '12px', background: '#ffffff', fontSize: '12px', color: '#475569' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setInstructionTab('mbanking')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: instructionTab === 'mbanking' ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    background: instructionTab === 'mbanking' ? '#f0f9ff' : '#ffffff',
                    color: instructionTab === 'mbanking' ? '#0369a1' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  m-Banking
                </button>
                <button
                  type="button"
                  onClick={() => setInstructionTab('atm')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: instructionTab === 'atm' ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    background: instructionTab === 'atm' ? '#f0f9ff' : '#ffffff',
                    color: instructionTab === 'atm' ? '#0369a1' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  ATM
                </button>
                <button
                  type="button"
                  onClick={() => setInstructionTab('ibanking')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: instructionTab === 'ibanking' ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    background: instructionTab === 'ibanking' ? '#f0f9ff' : '#ffffff',
                    color: instructionTab === 'ibanking' ? '#0369a1' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  i-Banking
                </button>
              </div>

              {instructionTab === 'mbanking' && (
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.4 }}>
                  {selectedBank === 'bca' && (
                    <>
                      <li>Buka aplikasi <strong>m-BCA</strong> lalu login.</li>
                      <li>Pilih menu <strong>m-Transfer &gt; BCA Virtual Account</strong>.</li>
                      <li>Masukkan Nomor VA: <strong>{vaNumber}</strong>.</li>
                      <li>Periksa nominal tagihan ({formatRupiah(total)}) lalu konfirmasi PIN.</li>
                    </>
                  )}
                  {selectedBank === 'mandiri' && (
                    <>
                      <li>Buka aplikasi <strong>Livin' by Mandiri</strong> lalu login.</li>
                      <li>Pilih menu <strong>Bayar &gt; Pembayaran Baru</strong>.</li>
                      <li>Pilih penyedia jasa <strong>Rangers Store ({billerCode || '70012'})</strong>.</li>
                      <li>Masukkan Nomor Pelanggan / Bill Key: <strong>{billKey}</strong>.</li>
                      <li>Konfirmasi rincian pembayaran lalu masukkan PIN.</li>
                    </>
                  )}
                  {selectedBank === 'bni' && (
                    <>
                      <li>Buka aplikasi <strong>BNI Mobile Banking</strong>.</li>
                      <li>Pilih menu <strong>Transfer &gt; Virtual Account Billing</strong>.</li>
                      <li>Pilih rekening debit, lalu input VA: <strong>{vaNumber}</strong>.</li>
                      <li>Konfirmasi nominal dan masukkan password transaksi.</li>
                    </>
                  )}
                  {selectedBank === 'bri' && (
                    <>
                      <li>Buka aplikasi <strong>BRImo</strong> lalu login.</li>
                      <li>Pilih menu <strong>Pembayaran &gt; BRIVA</strong>.</li>
                      <li>Masukkan Nomor BRIVA: <strong>{vaNumber}</strong>.</li>
                      <li>Pastikan nominal sesuai lalu masukkan PIN BRImo.</li>
                    </>
                  )}
                  {selectedBank === 'permata' && (
                    <>
                      <li>Buka aplikasi <strong>PermataMobile X</strong>.</li>
                      <li>Pilih <strong>Bayar Tagihan &gt; Virtual Account</strong>.</li>
                      <li>Masukkan Nomor VA: <strong>{vaNumber}</strong>.</li>
                      <li>Konfirmasi dan masukkan PIN transaksi.</li>
                    </>
                  )}
                </ol>
              )}

              {instructionTab === 'atm' && (
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.4 }}>
                  <li>Masukkan kartu ATM dan PIN Anda di mesin ATM.</li>
                  <li>Pilih menu <strong>Transaksi Lainnya &gt; Transfer / Pembayaran</strong>.</li>
                  <li>Pilih <strong>Virtual Account</strong> (atau Multi Payment untuk Mandiri).</li>
                  <li>Masukkan nomor Virtual Account di atas.</li>
                  <li>Periksa detail tagihan, lalu pilih <strong>Ya / Benar</strong> untuk melunasi.</li>
                </ol>
              )}

              {instructionTab === 'ibanking' && (
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.4 }}>
                  <li>Login ke portal Internet Banking bank Anda.</li>
                  <li>Pilih menu <strong>Transfer Dana &gt; Transfer ke Virtual Account</strong>.</li>
                  <li>Masukkan nomor rekening VA yang tertera.</li>
                  <li>Validasi token / OTP untuk menyelesaikan transaksi.</li>
                </ol>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            disabled={loading || checking}
            onClick={handleSimulatePayment}
            style={{
              width: '100%',
              background: '#059669',
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
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            }}
          >
            <CheckCircle size={16} />
            <span>Simulasi Pembayaran Berhasil</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={loading || checking}
              onClick={handleCheckStatus}
              style={{
                flex: 1,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
              <span>Cek Status</span>
            </button>

            {simulatorUrl && (
              <a
                href={simulatorUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1.2,
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1d4ed8',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>Simulator Midtrans</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
