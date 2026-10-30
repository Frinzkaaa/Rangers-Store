import { NextResponse } from 'next/server';
import { getBatches, createBatch, updateBatch, deleteBatch, getActiveAverageHpp } from '../../../lib/db';

export async function GET() {
  try {
    const batches = await getBatches();
    const avgHpp = await getActiveAverageHpp();
    return NextResponse.json({ success: true, batches, avgHpp });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama_batch, supplier, harga_beli, ongkir, jumlah_item, modal_per_item, catatan } = body;

    if (!nama_batch || !harga_beli || !jumlah_item) {
      return NextResponse.json(
        { success: false, error: 'Nama batch, harga beli, dan jumlah item wajib diisi' },
        { status: 400 }
      );
    }

    const batch = await createBatch({
      nama_batch,
      supplier: supplier || '',
      harga_beli: Number(harga_beli),
      ongkir: Number(ongkir || 0),
      jumlah_item: Number(jumlah_item),
      modal_per_item: modal_per_item ? Number(modal_per_item) : undefined,
      catatan: catatan || '',
    });

    return NextResponse.json({ success: true, batch });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nama_batch, supplier, harga_beli, ongkir, jumlah_item, modal_per_item, sisa_item, catatan } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID batch wajib disertakan' }, { status: 400 });
    }

    const updated = await updateBatch(Number(id), {
      nama_batch,
      supplier,
      harga_beli: harga_beli !== undefined ? Number(harga_beli) : undefined,
      ongkir: ongkir !== undefined ? Number(ongkir) : undefined,
      jumlah_item: jumlah_item !== undefined ? Number(jumlah_item) : undefined,
      modal_per_item: modal_per_item !== undefined ? Number(modal_per_item) : undefined,
      sisa_item: sisa_item !== undefined ? Number(sisa_item) : undefined,
      catatan,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Batch tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, batch: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID batch wajib disertakan' }, { status: 400 });
    }

    const deleted = await deleteBatch(Number(id));
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Batch tidak ditemukan atau gagal dihapus' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Batch berhasil dihapus' });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
