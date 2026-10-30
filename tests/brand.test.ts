import assert from 'node:assert';
import { BRAND, NAV_LINKS } from '../src/lib/constants';

console.log('Running brand.test.ts...');

// Assert brand identity
assert.strictEqual(BRAND.name, 'Rangers Store', 'Brand name must be Rangers Store');
assert.strictEqual(BRAND.tagline, 'POS & Kasir Thrifting Mall / Bazar', 'Brand tagline must be accurate');

// Assert navigation links exist and are correct
const hrefs = NAV_LINKS.map(link => link.href);
assert.ok(hrefs.includes('/pos'), 'Must have /pos link');
assert.ok(hrefs.includes('/dashboard'), 'Must have /dashboard link');
assert.ok(hrefs.includes('/batches'), 'Must have /batches link');
assert.ok(hrefs.includes('/keuangan'), 'Must have /keuangan link');

console.log('✅ brand.test.ts passed!');
