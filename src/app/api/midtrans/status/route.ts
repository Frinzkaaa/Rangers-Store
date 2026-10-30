import { NextResponse } from 'next/server';
import { getTransactions, updateTransactionStatus } from '../../../../lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const order_id = searchParams.get('order_id');

  if (!order_id) {
    return NextResponse.json({ success: false, error: 'Missing order_id' }, { status: 400 });
  }

  const transactions = await getTransactions();
  const trans = transactions.find((t) => t.order_id === order_id);

  if (!trans) {
    return NextResponse.json({ success: false, error: 'Transaksi tidak ditemukan' }, { status: 404 });
  }

  // Check live status on Midtrans if server key is present
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (serverKey && trans.status_pembayaran === 'pending') {
    try {
      const auth = Buffer.from(`${serverKey}:`).toString('base64');
      const response = await fetch(`https://api.sandbox.midtrans.com/v2/${order_id}/status`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
        },
      });
      const data = await response.json();
      if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
        const updated = await updateTransactionStatus(order_id, 'settlement');
        return NextResponse.json({ success: true, status: 'settlement', transaction: updated });
      }
    } catch (err) {
      console.error('Error fetching status from Midtrans:', err);
    }
  }

  return NextResponse.json({ success: true, status: trans.status_pembayaran, transaction: trans });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, action } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'Missing order_id' }, { status: 400 });
    }

    if (action === 'simulate_settlement') {
      const updated = await updateTransactionStatus(order_id, 'settlement');
      return NextResponse.json({ success: true, status: 'settlement', transaction: updated });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
