/**
 * Financial and accounting calculation utilities for Rangers Store
 */

export function calcBatchUnitCost(hargaBeli: number, ongkir: number, jumlahItem: number): number {
  if (!jumlahItem || jumlahItem <= 0) return 0;
  return Math.round((hargaBeli + ongkir) / jumlahItem);
}

export function calcAmortizedRent(rentNominal: number, periode: string, daysInFilter: number = 1): number {
  if (!rentNominal || rentNominal <= 0) return 0;
  
  switch (periode) {
    case 'harian':
      return Math.round(rentNominal * daysInFilter);
    case 'bulanan':
      return Math.round((rentNominal / 30) * daysInFilter);
    case '3_bulan':
      return Math.round((rentNominal / 90) * daysInFilter);
    case '6_bulan':
      return Math.round((rentNominal / 180) * daysInFilter);
    case 'tahunan':
      return Math.round((rentNominal / 365) * daysInFilter);
    case 'sekali':
    default:
      return Math.round(rentNominal);
  }
}

export function calcNetProfit(
  omzet: number,
  cogs: number,
  rentCost: number,
  transportCost: number
): number {
  return omzet - cogs - rentCost - transportCost;
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}
