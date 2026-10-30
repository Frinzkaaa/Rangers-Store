import { NextResponse } from 'next/server';
import { getFinancialSummary, getTransactions, getBatches } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start') || undefined;
    const end = searchParams.get('end') || undefined;

    const summary = await getFinancialSummary(start, end);
    const transactions = await getTransactions();
    const batches = await getBatches();

    const toDateStr = (dateVal: any): string => {
      if (!dateVal) return '';
      if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
      return String(dateVal).split('T')[0];
    };

    // Today's metrics (local date YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrans = transactions.filter((t) => {
      return toDateStr(t.created_at) === todayStr && t.status_pembayaran === 'settlement';
    });

    const omzetHariIni = todayTrans.reduce((acc, t) => acc + t.total, 0);
    const pcsHariIni = todayTrans.reduce((acc, t) => acc + t.total_pcs, 0);
    const countHariIni = todayTrans.length;

    let cogsHariIni = 0;
    for (const t of todayTrans) {
      if (t.items) {
        for (const it of t.items) {
          cogsHariIni += (it.modal_satuan_tercatat || 0) * it.qty;
        }
      }
    }
    const labaKotorHariIni = omzetHariIni - cogsHariIni;

    // Price tier breakdown across settlement transactions
    const priceTierMap: Record<number, number> = {};
    for (const t of transactions.filter((t) => t.status_pembayaran === 'settlement')) {
      if (t.items) {
        for (const it of t.items) {
          priceTierMap[it.harga_satuan] = (priceTierMap[it.harga_satuan] || 0) + it.qty;
        }
      }
    }

    const priceTiers = Object.entries(priceTierMap)
      .map(([nominal, qty]) => ({
        nominal: Number(nominal),
        qty,
      }))
      .sort((a, b) => b.qty - a.qty);

    // Last 7 days trend
    const last7Days: Array<{ date: string; label: string; omzet: number; pcs: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

      const dayTrans = transactions.filter(
        (t) => toDateStr(t.created_at) === dStr && t.status_pembayaran === 'settlement'
      );
      const dayOmzet = dayTrans.reduce((acc, t) => acc + t.total, 0);
      const dayPcs = dayTrans.reduce((acc, t) => acc + t.total_pcs, 0);

      last7Days.push({
        date: dStr,
        label: dayName,
        omzet: dayOmzet,
        pcs: dayPcs,
      });
    }

    return NextResponse.json({
      success: true,
      today: {
        omzet: omzetHariIni,
        pcs: pcsHariIni,
        count: countHariIni,
        labaKotor: labaKotorHariIni,
      },
      summary,
      priceTiers,
      last7Days,
      activeBatchesCount: batches.length,
      totalStockRemaining: batches.reduce((acc, b) => acc + b.sisa_item, 0),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
