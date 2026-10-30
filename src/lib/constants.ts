export const BRAND = {
  name: 'Rangers Store',
  tagline: 'POS & Kasir Thrifting Mall / Bazar',
  currency: 'IDR',
  locale: 'id-ID',
};

export const NAV_LINKS = [
  { href: '/pos', label: 'Kasir POS', icon: 'ShoppingBag' },
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/batches', label: 'Batch Bal', icon: 'Package' },
  { href: '/keuangan', label: 'Keuangan & Laba', icon: 'CircleDollarSign' },
];

export interface ThriftPresetItem {
  id: string;
  nominal: number;
  nama: string;
  kategori: string;
  tagColor: 'orange' | 'blue' | 'purple' | 'green' | 'pink' | 'yellow';
  iconType: 'tshirt' | 'shirt' | 'sweater' | 'hoodie' | 'jacket' | 'star';
  deskripsi: string;
}

export const THRIFT_CATALOG_ITEMS: ThriftPresetItem[] = [
  {
    id: 'tag-25k',
    nominal: 25000,
    nama: 'Kaos Basic / Aksesoris',
    kategori: 'Kaos',
    tagColor: 'orange',
    iconType: 'tshirt',
    deskripsi: 'Kaos polos, topi, bandana, belt',
  },
  {
    id: 'tag-35k',
    nominal: 35000,
    nama: 'Baju Kaos Vintage / Sablon',
    kategori: 'Kaos',
    tagColor: 'blue',
    iconType: 'tshirt',
    deskripsi: 'Kaos band, festival, anime USA',
  },
  {
    id: 'tag-45k',
    nominal: 45000,
    nama: 'Kemeja Flannel / Polos',
    kategori: 'Kemeja',
    tagColor: 'purple',
    iconType: 'shirt',
    deskripsi: 'Kemeja motif kotak, corduroy vintage',
  },
  {
    id: 'tag-50k',
    nominal: 50000,
    nama: 'Crewneck Sweatshirt 90s',
    kategori: 'Crewneck',
    tagColor: 'green',
    iconType: 'sweater',
    deskripsi: 'Sweater bordir kampus, Russell, Champion',
  },
  {
    id: 'tag-65k',
    nominal: 65000,
    nama: 'Celana Denim / Cargo Chino',
    kategori: 'Celana',
    tagColor: 'blue',
    iconType: 'shirt',
    deskripsi: 'Jeans straight fit, baggy, skate pants',
  },
  {
    id: 'tag-75k',
    nominal: 75000,
    nama: 'Hoodie Boxy Fit / Pullover',
    kategori: 'Hoodie',
    tagColor: 'pink',
    iconType: 'hoodie',
    deskripsi: 'Hoodie tebal fleece USA, oversized fit',
  },
  {
    id: 'tag-100k',
    nominal: 100000,
    nama: 'Jaket Denim / Windbreaker 90s',
    kategori: 'Jaket',
    tagColor: 'purple',
    iconType: 'jacket',
    deskripsi: 'Jaket jeans trucker, parasut vintage',
  },
  {
    id: 'tag-125k',
    nominal: 125000,
    nama: 'Jaket Tracktop / Varsity',
    kategori: 'Jaket',
    tagColor: 'orange',
    iconType: 'jacket',
    deskripsi: 'Tracktop Adidas vintage, baseball jacket',
  },
  {
    id: 'tag-150k',
    nominal: 150000,
    nama: 'Vintage Special Leather / Rare',
    kategori: 'Spesial',
    tagColor: 'yellow',
    iconType: 'star',
    deskripsi: 'Koleksi jaket kulit, trench coat langka',
  },
];

export const DEFAULT_PRICE_PRESETS = [
  { nominal: 25000, label: 'Kaos / Aksesoris' },
  { nominal: 35000, label: 'Baju / Kemeja' },
  { nominal: 50000, label: 'Crewneck / Celana' },
  { nominal: 75000, label: 'Hoodie / Flannel' },
  { nominal: 100000, label: 'Jaket / Denim' },
  { nominal: 150000, label: 'Vintage Special' },
];
