'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/calc';
import { CartItem, calculateCartTotals, validateCartBeforeCheckout } from '../lib/cart';
import { THRIFT_CATALOG_ITEMS, ThriftPresetItem } from '../lib/constants';
import CashModal from './CashModal';
import QrisModal from './QrisModal';
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
  Receipt,
  Edit2,
  Check,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PosCashier: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [diskon, setDiskon] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>("Customer's Name");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('Booth Mall UG');
  const [orderType, setOrderType] = useState<string>('Bazar Langsung');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [storeOpen, setStoreOpen] = useState<boolean>(true);

  // Modals
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [showCashModal, setShowCashModal] = useState<boolean>(false);
  const [showQrisModal, setShowQrisModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qris' | 'tunai'>('qris');
  const [lastSuccessTrans, setLastSuccessTrans] = useState<any | null>(null);

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
    { id: 'all', label: 'All Menu', count: '120 items', icon: 'all' as const },
    { id: 'Kaos', label: 'T-Shirts', count: '45 items', icon: 'tshirt' as const },
    { id: 'Kemeja', label: 'Flannel/Shirts', count: '25 items', icon: 'shirt' as const },
    { id: 'Crewneck', label: 'Crewnecks', count: '20 items', icon: 'sweater' as const },
    { id: 'Hoodie', label: 'Hoodies', count: '15 items', icon: 'hoodie' as const },
    { id: 'Jaket', label: 'Jackets/Denim', count: '15 items', icon: 'jacket' as const },
    { id: 'Spesial', label: 'Rare Vintage', count: '10 items', icon: 'star' as const },
  ];

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
    const priceNum = parseInt(customPrice.replace(/\D/g, ''), 10);
    if (!priceNum || priceNum <= 0) return;

    handleAddItem(priceNum, customLabel.trim() || 'Item Spesial');
    setCustomPrice('');
    setCustomLabel('');
    setShowCustomModal(false);
  };

  const handleCheckoutClick = () => {
    if (!valid) return;
    if (selectedPaymentMethod === 'qris') {
      setShowQrisModal(true);
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => setStoreOpen(!storeOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: storeOpen ? '#059669' : '#dc2626',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: storeOpen ? '#10b981' : '#ef4444',
                }}
              />
              <span>{storeOpen ? 'Lapak Buka' : 'Close Order'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setItems([]);
                setDiskon(0);
              }}
              title="Reset Order"
              style={{
                background: '#fef2f2',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ef4444',
              }}
            >
              <Power size={15} />
            </button>
          </div>
        </div>

        {/* Category Carousel / Pills */}
        <div className="category-row">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
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
                <div className="category-count">{cat.count}</div>
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
        {/* Header */}
        <div className="cart-header">
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
        </div>

        {/* Sub-selectors */}
        <div className="cart-controls-row">
          <div className="cart-control-chip">
            <span>{selectedLocation}</span>
            <ChevronDown size={14} color="#94a3b8" />
          </div>
          <div className="cart-control-chip">
            <span>{orderType}</span>
            <ChevronDown size={14} color="#94a3b8" />
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
            <span>Subtotal</span>
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
            <span className="cart-total-label">TOTAL</span>
            <span className="cart-total-value">{formatRupiah(total)}</span>
          </div>
        </div>

        {/* Discount & Payment Method Chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {/* Add Promo / Discount input pill */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: '999px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <input
              type="number"
              placeholder="Diskon (Rp)"
              value={diskon || ''}
              onChange={(e) => setDiskon(Math.max(0, Number(e.target.value)))}
              style={{
                width: '80%',
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

          {/* Payment Method toggle */}
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod(selectedPaymentMethod === 'qris' ? 'tunai' : 'qris')}
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: '999px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {selectedPaymentMethod === 'qris' ? (
              <>
                <QrCode size={13} color="#2563eb" />
                <span>QRIS Dinamis</span>
              </>
            ) : (
              <>
                <Banknote size={13} color="#059669" />
                <span>Tunai (Cash)</span>
              </>
            )}
          </button>
        </div>

        {/* Big Blue Place Order Button */}
        <button
          type="button"
          className="btn-place-order"
          disabled={!valid}
          onClick={handleCheckoutClick}
        >
          <span>Place Order</span>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>({total_pcs} pcs)</span>
        </button>

        {!valid && items.length > 0 && (
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

      {/* Success Transaction Modal */}
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
              Order Placed Successfully!
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {lastSuccessTrans.order_id}
            </p>

            <div
              style={{
                background: '#f8fafc',
                padding: '18px',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                margin: '22px 0',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                <span>Metode Pembayaran:</span>
                <strong style={{ color: '#1e293b', textTransform: 'uppercase' }}>{lastSuccessTrans.metode_bayar}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                <span>Total Item:</span>
                <strong style={{ color: '#1e293b' }}>{lastSuccessTrans.total_pcs} pcs</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#1e293b', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ fontWeight: 600 }}>Total Lunas:</span>
                <strong style={{ color: '#2563eb', fontWeight: 900 }}>{formatRupiah(lastSuccessTrans.total)}</strong>
              </div>
              {lastSuccessTrans.kembalian !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                  <span>Kembalian:</span>
                  <strong style={{ color: '#059669' }}>{formatRupiah(lastSuccessTrans.kembalian)}</strong>
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
