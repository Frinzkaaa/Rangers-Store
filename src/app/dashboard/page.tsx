'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatRupiah } from '../../lib/calc';
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
        Memuat dashboard performa toko...
      </div>
    );
  }

  const today = data?.today || { omzet: 0, pcs: 0, count: 0, labaKotor: 0 };
  const last7Days = data?.last7Days || [];
  const priceTiers = data?.priceTiers || [];

  // Max omzet for bar chart scaling
  const maxOmzet = Math.max(...last7Days.map((d: any) => d.omzet), 100000);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Dashboard Performa Lapak
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Ringkasan omzet, barang terjual hari ini, tren 7 hari terakhir, dan kategori harga terlaris.
          </p>
        </div>

        <Link href="/pos" className="btn btn-emerald" style={{ gap: '8px', fontSize: '14px', textDecoration: 'none' }}>
          <ShoppingBag size={18} />
          <span>Buka Kasir POS</span>
        </Link>
      </div>

      {/* Row 1: Today's Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="clean-card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Omzet Hari Ini
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {formatRupiah(today.omzet)}
          </div>
          <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
            {today.count} transaksi selesai
          </div>
        </div>

        <div className="clean-card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Barang Terjual Hari Ini
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#6366f1', marginTop: '6px' }}>
            {today.pcs} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>pcs</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Pakaian & aksesoris thrift
          </div>
        </div>

        <div className="clean-card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Estimasi Laba Kotor Hari Ini
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
            {formatRupiah(today.labaKotor)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Omzet minus modal HPP bal
          </div>
        </div>

        <div className="clean-card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Sisa Stok di Lapak
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {data?.totalStockRemaining || 0} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>pcs</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Dari {data?.activeBatchesCount || 0} batch bal aktif
          </div>
        </div>
      </div>

      {/* Row 2: Visual Charts & Top Tiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Chart 1: 7 Days Sales Trend */}
        <div className="clean-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#059669" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Tren Omzet 7 Hari Terakhir
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Harian</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '180px', paddingBottom: '10px' }}>
            {last7Days.map((d: any) => {
              const heightPct = Math.max(10, Math.round((d.omzet / maxOmzet) * 100));
              return (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '6px', whiteSpace: 'nowrap' }}>
                    {d.omzet > 0 ? (d.omzet >= 1000000 ? `${(d.omzet / 1000000).toFixed(1)}M` : `${Math.round(d.omzet / 1000)}k`) : '0'}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPct}%`,
                      background: d.omzet > 0 ? '#10b981' : '#e2e8f0',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.4s ease',
                    }}
                    title={`${d.label}: ${formatRupiah(d.omzet)} (${d.pcs} pcs)`}
                  />
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px', fontWeight: 600 }}>
                    {d.label.split(',')[0] || d.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Top Selling Price Points */}
        <div className="clean-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#6366f1" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Tier Harga Paling Laku
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Berdasarkan pcs terjual</span>
          </div>

          {priceTiers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '13px' }}>
              Belum ada riwayat transaksi penjualan
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {priceTiers.slice(0, 5).map((tier: any, idx: number) => {
                const maxQty = priceTiers[0].qty || 1;
                const pct = Math.round((tier.qty / maxQty) * 100);

                return (
                  <div key={tier.nominal}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        #{idx + 1} Tag {formatRupiah(tier.nominal)}
                      </span>
                      <span style={{ fontWeight: 600, color: '#6366f1' }}>
                        {tier.qty} pcs terjual
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#eef2ff', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#6366f1', borderRadius: '999px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
