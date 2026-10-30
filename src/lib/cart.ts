export interface CartItem {
  harga_satuan: number;
  qty: number;
  label?: string;
}

export interface CartTotals {
  subtotal: number;
  diskon: number;
  total: number;
  total_pcs: number;
}

export function calculateCartTotals(items: CartItem[], diskonNominal: number = 0): CartTotals {
  const subtotal = items.reduce((acc, item) => acc + item.harga_satuan * item.qty, 0);
  const total_pcs = items.reduce((acc, item) => acc + item.qty, 0);
  const safeDiscount = Math.max(0, Math.min(diskonNominal || 0, subtotal));
  const total = Math.max(0, subtotal - safeDiscount);

  return {
    subtotal,
    diskon: safeDiscount,
    total,
    total_pcs,
  };
}

export function validateCartBeforeCheckout(items: CartItem[], diskonNominal: number = 0): { valid: boolean; reason?: string } {
  if (!items || items.length === 0) {
    return { valid: false, reason: 'Keranjang belanja masih kosong' };
  }

  const totals = calculateCartTotals(items, diskonNominal);

  if (diskonNominal > totals.subtotal) {
    return { valid: false, reason: 'Diskon melebihi subtotal belanja' };
  }

  if (totals.total <= 0) {
    return { valid: false, reason: 'Total pembayaran harus lebih besar dari Rp 0' };
  }

  return { valid: true };
}

export function calculateChange(totalBelanja: number, uangDiterima: number): { kembalian: number; isEnough: boolean } {
  const kembalian = uangDiterima - totalBelanja;
  return {
    kembalian,
    isEnough: kembalian >= 0,
  };
}
