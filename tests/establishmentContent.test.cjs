const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/establishmentContent.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('voucher normalization follows the establishment dashboard schema', async () => {
  const { normalizeVoucher } = await modulePromise;
  const voucher = normalizeVoucher('offer-1', {
    title: ' Weekend Deal ',
    establishmentId: 'business-1',
    establishmentName: 'Cafe Naga',
    discountType: 'percentage',
    discountValue: 20,
    maxClaimLimit: 10,
    claimCount: 3,
    status: 'approved',
    validFrom: { seconds: 1788724800 },
    validUntil: { seconds: 1788897600 },
  });

  assert.equal(voucher.title, 'Weekend Deal');
  assert.equal(voucher.discountDisplay, '20% OFF');
  assert.equal(voucher.remainingClaims, 7);
  assert.equal(voucher.establishmentId, 'business-1');
});

test('only currently valid and claimable approved vouchers are available', async () => {
  const { isVoucherAvailable, normalizeVoucher } = await modulePromise;
  const now = Date.parse('2026-09-07T12:00:00+08:00');
  const base = {
    status: 'approved',
    validFrom: new Date(now - 1000),
    validUntil: new Date(now + 1000),
    maxClaimLimit: 5,
    claimCount: 1,
  };

  assert.equal(isVoucherAvailable(normalizeVoucher('valid', base), now), true);
  assert.equal(isVoucherAvailable(normalizeVoucher('pending', { ...base, status: 'pending' }), now), false);
  assert.equal(isVoucherAvailable(normalizeVoucher('expired', { ...base, validUntil: new Date(now - 1) }), now), false);
  assert.equal(isVoucherAvailable(normalizeVoucher('full', { ...base, claimCount: 5 }), now), false);
});

test('establishment content is attached only by its dashboard profile ID', async () => {
  const { attachEstablishmentContent } = await modulePromise;
  const [profile] = attachEstablishmentContent({
    profiles: [{ id: 'mobile-business-1', dashboardId: 'business-1', name: 'Cafe Naga', image: 'fallback' }],
    posts: [{ id: 'post-1', establishmentId: 'business-1', imageUrls: ['https://example.com/post.jpg'] }],
    gallery: [{ id: 'gallery-1', establishmentId: 'another-business', imageUrl: 'https://example.com/other.jpg' }],
    menuItems: [{ id: 'menu-1', establishmentId: 'business-1' }],
    vouchers: [{ id: 'voucher-1', establishmentId: 'business-1' }],
  });

  assert.equal(profile.posts.length, 1);
  assert.equal(profile.gallery.length, 0);
  assert.equal(profile.menuItems.length, 1);
  assert.equal(profile.vouchers.length, 1);
  assert.equal(profile.image, 'https://example.com/post.jpg');
});
