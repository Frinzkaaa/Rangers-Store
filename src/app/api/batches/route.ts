import { NextResponse } from 'next/server';
import { getBatches, createBatch, getActiveAverageHpp } from '../../../lib/db';

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
    const { nama_batch, supplier, harga_beli, ongkir, jumlah_item, catatan } = body;

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
      catatan: catatan || '',
    });

    return NextResponse.json({ success: true, batch });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
