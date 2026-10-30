import { NextResponse } from 'next/server';
import { getExpenses, createExpense } from '../../../lib/db';

export async function GET() {
  try {
    const expenses = await getExpenses();
    return NextResponse.json({ success: true, expenses });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jenis, deskripsi, nominal, periode, tanggal_mulai, tanggal_selesai } = body;

    if (!jenis || !deskripsi || !nominal || !tanggal_mulai) {
      return NextResponse.json(
        { success: false, error: 'Jenis, deskripsi, nominal, dan tanggal mulai wajib diisi' },
        { status: 400 }
      );
    }

    const expense = await createExpense({
      jenis,
      deskripsi,
      nominal: Number(nominal),
      periode: periode || 'sekali',
      tanggal_mulai,
      tanggal_selesai,
    });

    return NextResponse.json({ success: true, expense });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
