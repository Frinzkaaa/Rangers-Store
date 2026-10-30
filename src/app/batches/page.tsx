'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah, formatTanggalIndo, calcBatchUnitCost } from '../../lib/calc';
import { Batch } from '../../lib/db';
import {
  Package,
  Plus,
  Building2,
  Layers,
  CheckCircle,
  X,
  Pencil,
  Trash2,
  Calendar,
} from 'lucide-react';

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Form states
  const [namaBatch, setNamaBatch] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [hargaBeli, setHargaBeli] = useState<string>('');
  const [ongkir, setOngkir] = useState<string>('');
  const [jumlahItem, setJumlahItem] = useState<string>('');
  const [sisaItem, setSisaItem] = useState<string>('');
  const [customHpp, setCustomHpp] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchBatches = () => {
    setLoading(true);
    fetch('/api/batches')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBatches(data.batches);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingBatch(null);
    setNamaBatch('');
    setSupplier('');
    setHargaBeli('');
    setOngkir('');
    setJumlahItem('');
    setSisaItem('');
    setCustomHpp('');
    setCatatan('');
    setShowModal(true);
  };

  const handleOpenEditModal = (b: Batch) => {
    setEditingBatch(b);
    setNamaBatch(b.nama_batch);
    setSupplier(b.supplier || '');
    setHargaBeli(String(b.harga_beli));
    setOngkir(String(b.ongkir));
    setJumlahItem(String(b.jumlah_item));
    setSisaItem(String(b.sisa_item));
    setCustomHpp(String(b.modal_per_item));
    setCatatan(b.catatan || '');
    setShowModal(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBatch) {
        // Update batch
        const res = await fetch('/api/batches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingBatch.id,
            nama_batch: namaBatch,
            supplier,
            harga_beli: Number(hargaBeli),
            ongkir: Number(ongkir || 0),
            jumlah_item: Number(jumlahItem),
            sisa_item: sisaItem ? Number(sisaItem) : undefined,
            modal_per_item: customHpp ? Number(customHpp) : undefined,
            catatan,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          fetchBatches();
        } else {
          alert(data.error || 'Gagal mengubah batch');
        }
      } else {
        // Create batch
        const res = await fetch('/api/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama_batch: namaBatch,
            supplier,
            harga_beli: Number(hargaBeli),
            ongkir: Number(ongkir || 0),
            jumlah_item: Number(jumlahItem),
            modal_per_item: customHpp ? Number(customHpp) : undefined,
            catatan,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          fetchBatches();
        } else {
          alert(data.error || 'Gagal menambahkan batch');
        }
      }
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBatch = async (id: number, nama: string) => {
    if (!confirm(`Hapus batch "${nama}"? Data batch ini akan dihapus dari sistem.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/batches?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchBatches();
      } else {
        alert(data.error || 'Gagal menghapus batch');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  // Preview unit cost: if custom is filled use that, otherwise compute
  const autoUnitCost = calcBatchUnitCost(
    Number(hargaBeli || 0),
    Number(ongkir || 0),
    Number(jumlahItem || 0)
  );
  const effectiveUnitCost = customHpp && Number(customHpp) > 0 ? Number(customHpp) : autoUnitCost;

  const totalItemSemua = batches.reduce((acc, b) => acc + b.jumlah_item, 0);
  const sisaItemSemua = batches.reduce((acc, b) => acc + b.sisa_item, 0);
  const itemTerjualSemua = totalItemSemua - sisaItemSemua;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Manajemen Batch Bal (Karungan)
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Catat pembelian karung dari supplier atau tentukan HPP modal satuan sendiri untuk perhitungan laba rugi riil.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="btn btn-emerald"
          style={{ gap: '8px', fontSize: '14px' }}
        >
          <Plus size={18} />
          <span>+ Input Pembelian Bal</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="clean-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
            <Layers size={18} color="#6366f1" />
            <span>Total Batch Aktif</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {batches.length} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>karung</span>
          </div>
        </div>

        <div className="clean-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
            <Package size={18} color="#059669" />
            <span>Sisa Stok Tersedia</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
            {sisaItemSemua} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>/ {totalItemSemua} pcs</span>
          </div>
        </div>

        <div className="clean-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
            <CheckCircle size={18} color="#0284c7" />
            <span>Total Item Terjual</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7', marginTop: '8px' }}>
            {itemTerjualSemua} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>pcs</span>
          </div>
        </div>
      </div>

      {/* Batches List */}
      <div style={{ marginBottom: '14px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
        Daftar Pembelian Bal
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Memuat data batch bal...
        </div>
      ) : batches.length === 0 ? (
        <div className="clean-card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#475569' }}>Belum ada batch bal tercatat</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Klik tombol "+ Input Pembelian Bal" di atas untuk menambahkan karung pertama Anda.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {batches.map((b) => {
            const soldCount = b.jumlah_item - b.sisa_item;
            const pct = Math.min(100, Math.round((soldCount / b.jumlah_item) * 100));

            return (
              <div key={b.id} className="clean-card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{b.nama_batch}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      <Building2 size={13} />
                      <span>{b.supplier || 'Supplier Umum'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(b)}
                      title="Edit Batch Bal"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBatch(b.id, b.nama_batch)}
                      title="Hapus Batch Bal"
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px' }}>
                      #{b.id}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', margin: '14px 0' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Harga Bal + Ongkir</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {formatRupiah(b.harga_beli + b.ongkir)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>HPP Modal per Pcs</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                      {formatRupiah(b.modal_per_item)}
                    </div>
                  </div>
                </div>

                {/* Stock progress */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                    <span>Terjual: <strong>{soldCount} pcs</strong></span>
                    <span>Sisa: <strong style={{ color: b.sisa_item <= 10 ? '#ef4444' : '#0f172a' }}>{b.sisa_item} pcs</strong> ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#059669', borderRadius: '999px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
                  <span>Tercatat: {formatTanggalIndo(b.created_at)}</span>
                  {b.catatan && <span style={{ fontStyle: 'italic' }}>"{b.catatan}"</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {editingBatch ? 'Edit Data Batch Bal' : 'Input Batch Bal Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBatch}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Nama / Label Batch *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bal Crewneck USA Nov #2"
                  value={namaBatch}
                  onChange={(e) => setNamaBatch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Supplier / Lokasi Beli
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pasar Senen Blok III (Pak Hendra)"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Harga Beli Bal (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="3500000"
                    value={hargaBeli}
                    onChange={(e) => setHargaBeli(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Ongkir Pembelian (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="150000"
                    value={ongkir}
                    onChange={(e) => setOngkir(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: editingBatch ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Total Isi Bal (Pcs) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={jumlahItem}
                    onChange={(e) => setJumlahItem(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {editingBatch && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Sisa Stok Saat Ini (Pcs)
                    </label>
                    <input
                      type="number"
                      value={sisaItem}
                      onChange={(e) => setSisaItem(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>

              {/* HPP Modal per Item: Auto vs Custom Input */}
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  HPP Modal Satuan per Pcs (Rp)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder={`Otomatis: ${autoUnitCost > 0 ? autoUnitCost : '0'}`}
                    value={customHpp}
                    onChange={(e) => setCustomHpp(e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                  {customHpp && (
                    <button
                      type="button"
                      onClick={() => setCustomHpp('')}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Reset Otomatis
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  {customHpp && Number(customHpp) > 0 ? (
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ✓ Menggunakan HPP Manual: <strong>{formatRupiah(Number(customHpp))} / pcs</strong>
                    </span>
                  ) : (
                    <span>
                      Dihitung otomatis: (Harga Beli + Ongkir) / Isi Bal = <strong>{formatRupiah(autoUnitCost)} / pcs</strong>
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Catatan / Kualitas Sortir
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sortir Grade A 60%, B 40%"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1.5, background: '#059669', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 700, cursor: 'pointer', color: '#ffffff' }}
                >
                  {submitting ? 'Menyimpan...' : editingBatch ? 'Simpan Perubahan' : 'Simpan Pembelian Bal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
