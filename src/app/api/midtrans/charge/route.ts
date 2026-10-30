import { NextResponse } from 'next/server';
import { generateOrderId, chargeMidtransQris, chargeMidtransVa, SupportedBank } from '../../../../lib/midtrans';
import { createTransaction } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order_id = generateOrderId();
    const total = Number(body.total);

    if (!total || total <= 0) {
      return NextResponse.json({ success: false, error: 'Total nominal harus lebih dari 0' }, { status: 400 });
    }

    const paymentType = body.payment_type || (body.metode_bayar === 'transfer' ? 'bank_transfer' : 'qris');
    const bank = (body.bank || 'bca') as SupportedBank;

    // Handle Bank Transfer / Virtual Account
    if (paymentType === 'bank_transfer') {
      const vaResult = await chargeMidtransVa(order_id, total, bank);

      if (!vaResult.success) {
        return NextResponse.json({ success: false, error: vaResult.error }, { status: 502 });
      }

      const transaction = await createTransaction({
        order_id,
        customer_name: body.customer_name || 'Pelanggan',
        metode_bayar: 'transfer',
        subtotal: body.subtotal || total,
        diskon: body.diskon || 0,
        total,
        total_pcs: body.total_pcs || 1,
        status_pembayaran: 'pending',
        midtrans_transaction_id: vaResult.transaction_id,
        midtrans_qr_url: vaResult.va_number || (vaResult.biller_code ? `${vaResult.biller_code} / ${vaResult.bill_key}` : ''),
        items: (body.items || []).map((it: any) => ({
          harga_satuan: Number(it.harga_satuan) || 0,
          qty: Number(it.qty) || 1,
          subtotal: it.subtotal !== undefined ? Number(it.subtotal) : (Number(it.harga_satuan) || 0) * (Number(it.qty) || 1),
        })),
      });

      return NextResponse.json({
        success: true,
        order_id,
        payment_type: 'bank_transfer',
        bank: vaResult.bank,
        va_number: vaResult.va_number,
        bill_key: vaResult.bill_key,
        biller_code: vaResult.biller_code,
        expiry_time: vaResult.expiry_time,
        simulator_url: vaResult.simulator_url,
        transaction,
      });
    }

    // Default: QRIS
    const qrisResult = await chargeMidtransQris(order_id, total);

    if (!qrisResult.success) {
      return NextResponse.json({ success: false, error: qrisResult.error }, { status: 502 });
    }

    // Record pending transaction in DB
    const transaction = await createTransaction({
      order_id,
      customer_name: body.customer_name || 'Pelanggan',
      metode_bayar: 'qris',
      subtotal: body.subtotal || total,
      diskon: body.diskon || 0,
      total,
      total_pcs: body.total_pcs || 1,
      status_pembayaran: 'pending',
      midtrans_transaction_id: qrisResult.transaction_id,
      midtrans_qr_url: qrisResult.qr_url,
      items: (body.items || []).map((it: any) => ({
        harga_satuan: Number(it.harga_satuan) || 0,
        qty: Number(it.qty) || 1,
        subtotal: it.subtotal !== undefined ? Number(it.subtotal) : (Number(it.harga_satuan) || 0) * (Number(it.qty) || 1),
      })),
    });

    return NextResponse.json({
      success: true,
      order_id,
      payment_type: 'qris',
      qr_url: qrisResult.qr_url,
      transaction,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
