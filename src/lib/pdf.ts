import { jsPDF } from 'jspdf';
import { formatRupiah } from './calc';

export interface ReportPdfData {
  storeName: string;
  startDate: string;
  endDate: string;
  summary: {
    totalOmzet: number;
    totalPcs: number;
    totalTransaksi: number;
    totalCogs: number;
    labaKotor: number;
    totalRentCost: number;
    totalTransportCost: number;
    totalOtherCost: number;
    totalOperasional: number;
    labaBersih: number;
  };
  transactions: Array<{
    order_id: string;
    created_at: string;
    metode_bayar: string;
    total_pcs: number;
    total: number;
  }>;
  batches: Array<{
    nama_batch: string;
    supplier: string;
    modal_per_item: number;
    jumlah_item: number;
    sisa_item: number;
  }>;
}

export async function generateReportPdfBuffer(data: ReportPdfData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(data.storeName.toUpperCase(), margin, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Aplikasi Kasir Pintar & POS Lapak Thrifting Mall / Bazar', margin, y + 5);

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Dicetak: ${printDate}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Periode: ${data.startDate} s/d ${data.endDate}`, pageWidth - margin, y + 5, { align: 'right' });

  y += 12;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Title: Ringkasan Finansial
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('I. RINGKASAN KEUANGAN & LABA BERSIH', margin, y);
  y += 6;

  // Summary Table Box
  const summary = data.summary;
  const sumRows = [
    ['Total Omzet Penjualan', formatRupiah(summary.totalOmzet), `${summary.totalPcs} pcs (${summary.totalTransaksi} transaksi)`],
    ['Modal HPP Bal Terjual', formatRupiah(summary.totalCogs), 'Akumulasi modal karung'],
    ['Estimasi Laba Kotor', formatRupiah(summary.labaKotor), 'Omzet - Modal Bal Terjual'],
    ['Beban Sewa Tempat Lapak', formatRupiah(summary.totalRentCost), 'Proporsional harian periode'],
    ['Beban Transportasi Event', formatRupiah(summary.totalTransportCost), 'Biaya operasional bazar'],
    ['Laba Bersih Riil', formatRupiah(summary.labaBersih), 'Laba Kotor - Operasional'],
  ];

  doc.setFontSize(9);
  for (let i = 0; i < sumRows.length; i++) {
    const isHighlight = i === sumRows.length - 1;
    const row = sumRows[i];

    if (isHighlight) {
      doc.setFillColor(236, 253, 245); // light emerald
      doc.rect(margin, y - 4, contentWidth, 8, 'F');
      doc.setTextColor(5, 150, 105);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(margin, y - 4, contentWidth, 7, 'F');
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
    }

    doc.text(row[0], margin + 3, y);
    doc.setFont('helvetica', 'bold');
    doc.text(row[1], margin + 80, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(row[2], margin + 130, y);

    y += isHighlight ? 9 : 7;
  }

  y += 8;

  // Title: Rekap Batch Bal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('II. REKAPITULASI BATCH BAL (KARUNGAN)', margin, y);
  y += 6;

  // Header Table Batches
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 4, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Nama Batch Bal', margin + 3, y);
  doc.text('Supplier', margin + 70, y);
  doc.text('Modal/Pcs', margin + 115, y);
  doc.text('Total Isi', margin + 145, y);
  doc.text('Sisa Stok', margin + 165, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  for (const b of data.batches) {
    doc.text(b.nama_batch.substring(0, 32), margin + 3, y);
    doc.text((b.supplier || '-').substring(0, 22), margin + 70, y);
    doc.text(formatRupiah(b.modal_per_item), margin + 115, y);
    doc.text(`${b.jumlah_item} pcs`, margin + 145, y);
    doc.text(`${b.sisa_item} pcs`, margin + 165, y);
    y += 6;
  }

  y += 8;

  // Title: Rincian Transaksi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('III. DAFTAR RINCIAN TRANSAKSI', margin, y);
  y += 6;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 4, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Waktu', margin + 3, y);
  doc.text('No. Transaksi', margin + 38, y);
  doc.text('Metode', margin + 90, y);
  doc.text('Pcs', margin + 125, y);
  doc.text('Total Tagihan', pageWidth - margin - 3, y, { align: 'right' });
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  for (const t of data.transactions.slice(0, 25)) {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    const tDate = new Date(t.created_at).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    doc.text(tDate, margin + 3, y);
    doc.text(t.order_id, margin + 38, y);
    doc.text(t.metode_bayar.toUpperCase(), margin + 90, y);
    doc.text(`${t.total_pcs} pcs`, margin + 125, y);
    doc.setFont('helvetica', 'bold');
    doc.text(formatRupiah(t.total), pageWidth - margin - 3, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 6;
  }

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen audit resmi dihasilkan oleh Rangers Store POS & Kasir Thrifting Mall/Bazar', pageWidth / 2, 290, {
    align: 'center',
  });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
