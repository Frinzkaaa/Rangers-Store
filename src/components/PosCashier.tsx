'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/calc';
import { CartItem, calculateCartTotals, validateCartBeforeCheckout } from '../lib/cart';
import { THRIFT_CATALOG_ITEMS } from '../lib/constants';
import CashModal from './CashModal';
import QrisModal from './QrisModal';
import TransferModal from './TransferModal';
import ThriftIcon from './ThriftIcons';
import {
  Calendar,
  Clock,
  Menu,
  Power,
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  Landmark,
  Receipt,
  Edit2,
  Check,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PosCashier: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [diskon, setDiskon] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>("Customer's Name");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [storeOpen, setStoreOpen] = useState<boolean>(true);

  // Modals
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [showCashModal, setShowCashModal] = useState<boolean>(false);
  const [showQrisModal, setShowQrisModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'tunai' | 'qris' | 'transfer'>('tunai');
  const [lastSuccessTrans, setLastSuccessTrans] = useState<any | null>(null);

  // Load storeOpen status from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rangers_store_open');
      if (saved !== null) {
        setStoreOpen(saved === 'true');
      }
    } catch {
      // ignore in SSR
    }
  }, []);

  const handleToggleStore = () => {
    setStoreOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rangers_store_open', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const categories = [
    { id: 'all', label: 'All Menu', icon: 'all' as const },
    { id: 'Kaos', label: 'T-Shirts', icon: 'tshirt' as const },
    { id: 'Kemeja', label: 'Flannel/Shirts', icon: 'shirt' as const },
    { id: 'Crewneck', label: 'Crewnecks', icon: 'sweater' as const },
    { id: 'Celana', label: 'Pants/Denim', icon: 'shirt' as const },
    { id: 'Hoodie', label: 'Hoodies', icon: 'hoodie' as const },
    { id: 'Jaket', label: 'Jackets/Denim', icon: 'jacket' as const },
    { id: 'Spesial', label: 'Rare Vintage', icon: 'star' as const },
  ];

  const getCategoryCount = (catId: string) => {
    const count =
      catId === 'all'
        ? THRIFT_CATALOG_ITEMS.length
        : THRIFT_CATALOG_ITEMS.filter((item) => item.kategori === catId).length;
    return `${count} item${count > 1 ? 's' : ''}`;
  };

  // Filter items
  const filteredCatalog = THRIFT_CATALOG_ITEMS.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.kategori === selectedCategory;
    const matchSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.nominal).includes(searchQuery);
    return matchCategory && matchSearch;
  });

  const { subtotal, total, total_pcs } = calculateCartTotals(items, diskon);
  const { valid, reason } = validateCartBeforeCheckout(items, diskon);

  const handleAddItem = (nominal: number, label: string) => {
    if (!storeOpen) {
      alert('Lapak sedang tutup! Buka lapak di pojok kanan atas untuk mulai transaksi.');
      return;
    }
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

  const handleAddCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeOpen) {
      alert('Lapak sedang tutup! Buka lapak terlebih dahulu.');
      return;
    }
    const priceNum = parseInt(customPrice.replace(/\D/g, ''), 10);
    if (!priceNum || priceNum <= 0) return;

    handleAddItem(priceNum, customLabel.trim() || 'Item Spesial');
    setCustomPrice('');
    setCustomLabel('');
    setShowCustomModal(false);
  };

  const handleCheckoutClick = () => {
    if (!storeOpen) {
      alert('Lapak sedang tutup! Buka lapak di pojok kanan atas untuk mulai transaksi.');
      return;
    }
    if (!valid) return;

    if (selectedPaymentMethod === 'qris') {
      setShowQrisModal(true);
    } else if (selectedPaymentMethod === 'transfer') {
      setShowTransferModal(true);
    } else {
      setShowCashModal(true);
    }
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan transaksi ke database');
      }

      setShowCashModal(false);
      setLastSuccessTrans({
        order_id: data.transaction?.order_id || `TRX-${Date.now()}`,
        metode_bayar: 'tunai',
        subtotal,
        diskon,
        total,
        total_pcs,
        uangDiterima,
        kembalian,
        items: [...items],
      });
      setItems([]);
      setDiskon(0);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      alert('Gagal mencatat transaksi: ' + (err?.message || err));
    }
  };

  const handleQrisSuccess = (transaction: any) => {
    setShowQrisModal(false);
    setLastSuccessTrans({
      order_id: transaction?.order_id || `TRX-${Date.now()}`,
      metode_bayar: 'qris',
      subtotal: transaction?.subtotal || subtotal,
      diskon: transaction?.diskon !== undefined ? transaction.diskon : diskon,
      total: transaction?.total || total,
      total_pcs: transaction?.total_pcs || total_pcs,
      items: [...items],
    });
    setItems([]);
    setDiskon(0);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleTransferSuccess = async (catatanPengirim?: string) => {
    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metode_bayar: 'transfer',
          subtotal,
          diskon,
          total,
          total_pcs,
          status_pembayaran: 'settlement',
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan transaksi ke database');
      }

      setShowTransferModal(false);
      setLastSuccessTrans({
        order_id: data.transaction?.order_id || `TRX-${Date.now()}`,
        metode_bayar: 'transfer',
        subtotal,
        diskon,
        total,
        total_pcs,
        catatanPengirim,
        items: [...items],
      });
      setItems([]);
      setDiskon(0);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      alert('Gagal mencatat transaksi: ' + (err?.message || err));
    }
  };

  const getTagColorClass = (color: string) => {
    switch (color) {
      case 'orange':
        return { background: 'var(--tag-orange-bg)', color: 'var(--tag-orange-text)' };
      case 'pink':
        return { background: 'var(--tag-pink-bg)', color: 'var(--tag-pink-text)' };
      case 'purple':
        return { background: 'var(--tag-purple-bg)', color: 'var(--tag-purple-text)' };
      case 'green':
        return { background: 'var(--tag-green-bg)', color: 'var(--tag-green-text)' };
      case 'yellow':
        return { background: 'var(--tag-yellow-bg)', color: 'var(--tag-yellow-text)' };
      case 'blue':
      default:
        return { background: 'var(--tag-blue-bg)', color: 'var(--tag-blue-text)' };
    }
  };

  return (
    <div className="pos-layout">
      {/* LEFT PANEL: Menu & Catalog */}
      <div className="pos-menu-panel">
        {/* Top Bar: Menu, Date, Clock, Status */}
        <div className="pos-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <Menu size={18} />
            </button>

            <div className="pos-time-badge">
              <Calendar size={14} color="#64748b" />
              <span>{todayDateStr}</span>
            </div>

            <span style={{ color: '#cbd5e1' }}>-</span>

            <div className="pos-time-badge">
              <Clock size={14} color="#64748b" />
              <span>{currentTime || '12:00 PM'}</span>
            </div>
          </div>

          {/* Interactive Lapak Buka / Tutup Pill */}
          <button
            type="button"
            onClick={handleToggleStore}
            title={storeOpen ? 'Klik untuk Menutup Lapak' : 'Klik untuk Membuka Lapak'}
            style={{
              background: storeOpen ? '#ecfdf5' : '#fef2f2',
              border: `1.5px solid ${storeOpen ? '#a7f3d0' : '#fecaca'}`,
              borderRadius: '999px',
              padding: '6px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 700,
              color: storeOpen ? '#047857' : '#b91c1c',
              transition: 'all 0.2s',
              boxShadow: storeOpen ? '0 2px 6px rgba(16, 185, 129, 0.15)' : 'none',
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: storeOpen ? '#10b981' : '#ef4444',
                boxShadow: storeOpen ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
              }}
            />
            <span>{storeOpen ? 'Lapak Buka' : 'Lapak Tutup'}</span>
            <Power size={13} style={{ opacity: 0.8 }} />
          </button>
        </div>

        {/* Lapak Tutup Alert Banner */}
        {!storeOpen && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '16px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>⛔</span>
              <div>
                <strong style={{ fontSize: '13px', color: '#991b1b', display: 'block' }}>
                  Lapak Sedang Tutup
                </strong>
                <span style={{ fontSize: '12px', color: '#b91c1c' }}>
                  Kasir tidak dapat memproses pesanan saat tutup. Buka lapak untuk melayani transaksi.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleStore}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Buka Lapak Sekarang
            </button>
          </div>
        )}

        {/* Category Carousel / Pills with dynamic actual item counts */}
        <div className="category-row">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const countLabel = getCategoryCount(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`category-card ${isActive ? 'active' : ''}`}
              >
                <div
                  className="category-icon-bubble"
                  style={{
                    background: isActive ? '#dbeafe' : '#f8fafc',
                  }}
                >
                  <ThriftIcon
                    type={cat.icon}
                    size={18}
                    color={isActive ? '#2563eb' : '#64748b'}
                  />
                </div>
                <div className="category-name">{cat.label}</div>
                <div className="category-count">{countLabel}</div>
              </div>
            );
          })}
        </div>

        {/* Search Bar Pill */}
        <div className="search-pill-container">
          <input
            type="text"
            className="search-pill-input"
            placeholder="Search something vintage on your mind..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} className="search-pill-icon" />
        </div>

        {/* Thrift Product Cards Grid */}
        <div className="thrift-grid">
          {filteredCatalog.map((item) => {
            const tagStyle = getTagColorClass(item.tagColor);

            return (
              <div
                key={item.id}
                className="thrift-card"
                onClick={() => handleAddItem(item.nominal, item.nama)}
              >
                {/* Visual Vector Container */}
                <div className="thrift-visual-container">
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ThriftIcon
                      type={item.iconType}
                      size={32}
                      color={
                        item.tagColor === 'orange'
                          ? '#ea580c'
                          : item.tagColor === 'purple'
                          ? '#9333ea'
                          : item.tagColor === 'green'
                          ? '#16a34a'
                          : item.tagColor === 'pink'
                          ? '#e11d48'
                          : item.tagColor === 'yellow'
                          ? '#ca8a04'
                          : '#2563eb'
                      }
                    />
                  </div>
                </div>

                {/* Item Details */}
                <div>
                  <h4 className="thrift-card-title">{item.nama}</h4>
                  <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                    {item.deskripsi}
                  </p>
                </div>

                {/* Footer with pastel tag & price */}
                <div className="thrift-card-footer">
                  <span className="pastel-badge" style={tagStyle}>
                    {item.kategori}
                  </span>
                  <span className="thrift-card-price">
                    {formatRupiah(item.nominal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar: Action Pill */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <span>+ Input Harga Manual</span>
          </button>

          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Menampilkan {filteredCatalog.length} item pakaian
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Customer's Receipt / Cart */}
      <div className="pos-cart-panel">
        {/* Header: Customer Name & Order ID */}
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                }}
              >
                <Receipt size={18} />
              </div>
              <div>
                {isEditingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        outline: 'none',
                        width: '140px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      style={{ background: '#2563eb', border: 'none', color: '#fff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                    >
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="cart-customer-title"
                    onClick={() => setIsEditingName(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>{customerName}</span>
                    <Edit2 size={13} color="#94a3b8" />
                  </div>
                )}
                <div className="cart-order-num">Order Number: #TRX-1024</div>
              </div>
            </div>

            {/* Clear Cart Button */}
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Kosongkan keranjang belanja?')) {
                    setItems([]);
                    setDiskon(0);
                  }
                }}
                title="Kosongkan Keranjang"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '10px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="cart-items-scroll">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingBag size={40} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
              <div style={{ fontWeight: 600, color: '#64748b' }}>No Item Selected</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Tap items on the left to add to order
              </div>
            </div>
          ) : (
            items.map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8fafc',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                    {it.label || 'Item'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    {formatRupiah(it.harga_satuan)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stepper */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#f8fafc',
                      borderRadius: '999px',
                      border: '1px solid #e2e8f0',
                      padding: '2px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, -1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ minWidth: '22px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      {it.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, 1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div style={{ minWidth: '75px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                    {formatRupiah(it.harga_satuan * it.qty)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Serrated Ticket Divider */}
        <div className="cart-ticket-divider" />

        {/* Summary breakdown */}
        <div style={{ marginBottom: '14px' }}>
          <div className="cart-summary-line">
            <span>Subtotal ({total_pcs} pcs)</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="cart-summary-line">
            <span>Potongan Diskon</span>
            <span>{diskon > 0 ? `-${formatRupiah(diskon)}` : 'Rp 0'}</span>
          </div>
          <div className="cart-summary-line">
            <span>Pajak (Tax 0%)</span>
            <span>Rp 0</span>
          </div>

          <div className="cart-total-line">
            <span className="cart-total-label">TOTAL TAGIHAN</span>
            <span className="cart-total-value">{formatRupiah(total)}</span>
          </div>
        </div>

        {/* Discount Input Pill */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: '999px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <input
            type="number"
            placeholder="Diskon Potongan Harga (Rp)"
            value={diskon || ''}
            onChange={(e) => setDiskon(Math.max(0, Number(e.target.value)))}
            style={{
              width: '85%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1e293b',
            }}
          />
          <Check size={14} color="#059669" />
        </div>

        {/* Payment Method Selector (Tunai, QRIS, Transfer) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
          {/* Tunai */}
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod('tunai')}
            style={{
              background: selectedPaymentMethod === 'tunai' ? '#ecfdf5' : '#f8fafc',
              border: `1.5px solid ${selectedPaymentMethod === 'tunai' ? '#059669' : 'var(--border-subtle)'}`,
              borderRadius: '999px',
              padding: '8px 4px',
              fontSize: '11px',
              fontWeight: 700,
              color: selectedPaymentMethod === 'tunai' ? '#065f46' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
          >
            <Banknote size={13} color={selectedPaymentMethod === 'tunai' ? '#059669' : '#64748b'} />
            <span>Tunai</span>
          </button>

          {/* QRIS */}
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod('qris')}
            style={{
              background: selectedPaymentMethod === 'qris' ? '#eff6ff' : '#f8fafc',
              border: `1.5px solid ${selectedPaymentMethod === 'qris' ? '#2563eb' : 'var(--border-subtle)'}`,
              borderRadius: '999px',
              padding: '8px 4px',
              fontSize: '11px',
              fontWeight: 700,
              color: selectedPaymentMethod === 'qris' ? '#1e40af' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
          >
            <QrCode size={13} color={selectedPaymentMethod === 'qris' ? '#2563eb' : '#64748b'} />
            <span>QRIS</span>
          </button>

          {/* Transfer */}
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod('transfer')}
            style={{
              background: selectedPaymentMethod === 'transfer' ? '#faf5ff' : '#f8fafc',
              border: `1.5px solid ${selectedPaymentMethod === 'transfer' ? '#7c3aed' : 'var(--border-subtle)'}`,
              borderRadius: '999px',
              padding: '8px 4px',
              fontSize: '11px',
              fontWeight: 700,
              color: selectedPaymentMethod === 'transfer' ? '#6b21a8' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
          >
            <Landmark size={13} color={selectedPaymentMethod === 'transfer' ? '#7c3aed' : '#64748b'} />
            <span>Transfer</span>
          </button>
        </div>

        {/* Big Blue Place Order Button */}
        <button
          type="button"
          className="btn-place-order"
          disabled={!storeOpen || !valid}
          onClick={handleCheckoutClick}
          style={{
            opacity: !storeOpen || !valid ? 0.6 : 1,
            cursor: !storeOpen || !valid ? 'not-allowed' : 'pointer',
          }}
        >
          <span>{!storeOpen ? 'Lapak Sedang Tutup' : 'Place Order'}</span>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>
            {!storeOpen ? '' : `(${total_pcs} pcs)`}
          </span>
        </button>

        {!valid && items.length > 0 && storeOpen && (
          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', textAlign: 'center', fontWeight: 500 }}>
            ⚠️ {reason}
          </div>
        )}
      </div>

      {/* Manual Price Modal */}
      {showCustomModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '26px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '14px' }}>
              Input Nominal Harga Kustom
            </h3>
            <form onSubmit={handleAddCustomPrice}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Nominal Harga (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 85000"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '18px',
                    fontWeight: 700,
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Deskripsi / Tag Barang (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jaket Denim Levi's Vintage"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
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
                  type="submit"
                  style={{
                    flex: 1.5,
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#ffffff',
                  }}
                >
                  Tambahkan ke Order
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

      {/* Bank Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        total={total}
        totalPcs={total_pcs}
        onClose={() => setShowTransferModal(false)}
        onSuccess={handleTransferSuccess}
      />

      {/* Success Transaction Receipt Modal */}
      {lastSuccessTrans && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '32px', textAlign: 'center', maxWidth: '420px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Sparkles size={36} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>
              Transaksi Berhasil!
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Order ID: <strong style={{ color: '#64748b' }}>{lastSuccessTrans.order_id}</strong>
            </p>

            <div
              style={{
                background: '#f8fafc',
                padding: '18px',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                margin: '20px 0',
                textAlign: 'left',
              }}
            >
              {/* Conditional Payment Method Display */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                <span>Metode Pembayaran:</span>
                <strong style={{ color: '#1e293b', fontWeight: 700 }}>
                  {lastSuccessTrans.metode_bayar === 'tunai'
                    ? 'Tunai (Cash)'
                    : lastSuccessTrans.metode_bayar === 'qris'
                    ? 'QRIS Dinamis'
                    : 'Transfer Bank'}
                </strong>
              </div>

              {/* Total Pcs Terjual */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                <span>Jumlah Item Terjual:</span>
                <strong style={{ color: '#1e293b', fontWeight: 800 }}>
                  {lastSuccessTrans.total_pcs || 0} pcs
                </strong>
              </div>

              {/* Subtotal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                <span>Subtotal:</span>
                <strong style={{ color: '#1e293b' }}>
                  {formatRupiah(lastSuccessTrans.subtotal || lastSuccessTrans.total)}
                </strong>
              </div>

              {/* Diskon (hanya jika ada) */}
              {lastSuccessTrans.diskon > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#059669', marginBottom: '8px' }}>
                  <span>Potongan Diskon:</span>
                  <strong style={{ fontWeight: 700 }}>
                    -{formatRupiah(lastSuccessTrans.diskon)}
                  </strong>
                </div>
              )}

              {/* Total Tagihan (menggantikan 'Total Lunas' yang ambigu) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '16px',
                  color: '#1e293b',
                  paddingTop: '10px',
                  marginTop: '6px',
                  borderTop: '1px dashed #cbd5e1',
                }}
              >
                <span style={{ fontWeight: 700 }}>Total Tagihan:</span>
                <strong style={{ color: '#2563eb', fontWeight: 900, fontSize: '18px' }}>
                  {formatRupiah(lastSuccessTrans.total)}
                </strong>
              </div>

              {/* Uang Tunai Diterima & Kembalian (HANYA tampil jika metode Tunai!) */}
              {lastSuccessTrans.metode_bayar === 'tunai' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                    <span>Uang Tunai:</span>
                    <strong style={{ color: '#1e293b' }}>
                      {formatRupiah(lastSuccessTrans.uangDiterima || lastSuccessTrans.total)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#059669', marginTop: '6px' }}>
                    <span style={{ fontWeight: 700 }}>Kembalian:</span>
                    <strong style={{ fontWeight: 800, fontSize: '14px' }}>
                      {formatRupiah(lastSuccessTrans.kembalian || 0)}
                    </strong>
                  </div>
                </>
              )}

              {/* Status info for QRIS / Transfer */}
              {lastSuccessTrans.metode_bayar === 'qris' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669', marginTop: '8px' }}>
                  <CheckCircle size={14} />
                  <span>QRIS Lunas Terverifikasi</span>
                </div>
              )}

              {lastSuccessTrans.metode_bayar === 'transfer' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7c3aed', marginTop: '8px' }}>
                  <CheckCircle size={14} />
                  <span>Transfer Bank Terkonfirmasi {lastSuccessTrans.catatanPengirim ? `(${lastSuccessTrans.catatanPengirim})` : ''}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-place-order"
              onClick={() => setLastSuccessTrans(null)}
            >
              Buat Transaksi Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosCashier;
