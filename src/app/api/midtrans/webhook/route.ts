import { NextResponse } from 'next/server';
import { verifyMidtransSignature } from '../../../../lib/midtrans';
import { updateTransactionStatus } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (serverKey) {
      const isValid = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key, serverKey);
      if (!isValid) {
        return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 403 });
      }
    }

    if (transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept')) {
      await updateTransactionStatus(order_id, 'settlement');
    } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
      await updateTransactionStatus(order_id, 'cancel');
    } else if (transaction_status === 'expire') {
      await updateTransactionStatus(order_id, 'expire');
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
