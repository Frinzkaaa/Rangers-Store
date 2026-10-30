import { NextResponse } from 'next/server';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../../lib/db';

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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, jenis, deskripsi, nominal, periode, tanggal_mulai, tanggal_selesai } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pengeluaran wajib disertakan' }, { status: 400 });
    }

    const updated = await updateExpense(Number(id), {
      jenis,
      deskripsi,
      nominal: nominal !== undefined ? Number(nominal) : undefined,
      periode,
      tanggal_mulai,
      tanggal_selesai,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Data pengeluaran tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, expense: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pengeluaran wajib disertakan' }, { status: 400 });
    }

    const deleted = await deleteExpense(Number(id));
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Data pengeluaran tidak ditemukan atau gagal dihapus' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Data pengeluaran berhasil dihapus' });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
