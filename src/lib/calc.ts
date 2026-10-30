/**
 * Financial and accounting calculation utilities for Rangers Store
 */

export function calcBatchUnitCost(hargaBeli: number, ongkir: number, jumlahItem: number): number {
  if (!jumlahItem || jumlahItem <= 0) return 0;
  return Math.round((hargaBeli + ongkir) / jumlahItem);
}

export function calcDailyRent(rentNominal: number, periode: string): number {
  if (!rentNominal || rentNominal <= 0) return 0;
  switch (periode) {
    case 'harian':
      return Math.round(rentNominal);
    case 'bulanan':
      return Math.round(rentNominal / 30);
    case '3_bulan':
      return Math.round(rentNominal / 90);
    case '6_bulan':
      return Math.round(rentNominal / 180);
    case 'tahunan':
      return Math.round(rentNominal / 365);
    case 'sekali':
    default:
      return Math.round(rentNominal);
  }
}

export function calcAmortizedRent(rentNominal: number, periode: string, daysInFilter: number = 1): number {
  if (!rentNominal || rentNominal <= 0) return 0;
  const daily = calcDailyRent(rentNominal, periode);
  if (periode === 'sekali') return daily;
  return Math.round(daily * Math.max(1, daysInFilter));
}

export function calcNetProfit(
  omzet: number,
  cogs: number,
  rentCost: number,
  transportCost: number,
  otherCost: number = 0
): number {
  return omzet - cogs - rentCost - transportCost - otherCost;
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === undefined || amount === null) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function formatTanggalIndo(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatWaktuIndo(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
