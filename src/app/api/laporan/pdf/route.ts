import { NextResponse } from 'next/server';
import { generateReportPdfBuffer } from '../../../../lib/pdf';
import { getFinancialSummary, getBatches } from '../../../../lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const end = searchParams.get('end') || new Date().toISOString().split('T')[0];

    const summary = await getFinancialSummary(start, end);
    const batches = await getBatches();

    const pdfBuffer = await generateReportPdfBuffer({
      storeName: 'Rangers Store',
      startDate: start,
      endDate: end,
      summary,
      transactions: summary.transactions,
      batches,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan-rangers-store-${start}-${end}.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
