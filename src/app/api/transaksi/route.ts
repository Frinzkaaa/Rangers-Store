import { NextResponse } from 'next/server';
import { createTransaction, getTransactions } from '../../../lib/db';

export async function GET() {
  try {
    const transactions = await getTransactions();
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order_id = `TRX-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;

    const transaction = await createTransaction({
      order_id,
      metode_bayar: body.metode_bayar || 'tunai',
      subtotal: body.subtotal,
      diskon: body.diskon || 0,
      total: body.total,
      total_pcs: body.total_pcs,
      status_pembayaran: body.status_pembayaran || 'settlement',
      items: body.items,
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
