export function normalizeEstablishmentPost(id, data = {}) {
  return {
    id,
    establishmentId: cleanText(data.establishmentId),
    ownerId: cleanText(data.ownerId),
    caption: cleanText(data.caption),
    imageUrls: cleanImageUrls(data.imageUrls),
    category: cleanText(data.category) || 'Update',
    status: cleanText(data.status || 'published').toLowerCase(),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function normalizeEstablishmentGalleryItem(id, data = {}) {
  return {
    id,
    establishmentId: cleanText(data.establishmentId),
    ownerId: cleanText(data.ownerId),
    imageUrl: cleanImageUrl(data.imageUrl),
    caption: cleanText(data.caption),
    category: cleanText(data.category) || 'Place',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function normalizeEstablishmentMenuItem(id, data = {}) {
  return {
    id,
    establishmentId: cleanText(data.establishmentId),
    ownerId: cleanText(data.ownerId),
    name: cleanText(data.name) || 'Menu item',
    description: cleanText(data.description),
    price: toNumber(data.price),
    category: cleanText(data.category) || 'Menu',
    isAvailable: data.isAvailable !== false,
    imageUrl: cleanImageUrl(data.imageUrl),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function normalizeVoucher(id, data = {}) {
  const discountType = cleanText(data.discountType || 'percentage').toLowerCase();
  const discountValue = toNumber(data.discountValue);
  const maxClaimLimit = Math.max(0, Math.trunc(toNumber(data.maxClaimLimit)));
  const claimCount = Math.max(0, Math.trunc(toNumber(data.claimCount)));

  return {
    id,
    title: cleanText(data.title) || 'Establishment offer',
    description: cleanText(data.description),
    establishmentId: cleanText(data.establishmentId),
    establishmentName: cleanText(data.establishmentName) || 'Local establishment',
    discountType,
    discountValue,
    discountDisplay: discountType === 'fixed'
      ? `PHP ${formatAmount(discountValue)} OFF`
      : `${formatAmount(discountValue)}% OFF`,
    validFrom: toDate(data.validFrom),
    validUntil: toDate(data.validUntil),
    maxClaimLimit,
    claimCount,
    remainingClaims: Math.max(0, maxClaimLimit - claimCount),
    status: cleanText(data.status).toLowerCase(),
    termsAndConditions: cleanText(data.termsAndConditions),
    createdBy: cleanText(data.createdBy),
    createdAt: toDate(data.createdAt),
  };
}

export function isVoucherAvailable(voucher, now = Date.now()) {
  if (!voucher || !['approved', 'active'].includes(voucher.status)) return false;
  const validFrom = toMillis(voucher.validFrom);
  const validUntil = toMillis(voucher.validUntil);
  if (!validFrom || !validUntil || validFrom > now || validUntil < now) return false;
  if (voucher.maxClaimLimit <= 0 || voucher.claimCount >= voucher.maxClaimLimit) return false;
  return true;
}

export function attachEstablishmentContent({ profiles = [], posts = [], gallery = [], menuItems = [], vouchers = [] }) {
  return profiles.map((profile) => {
    const id = profile.dashboardId || profile.id;
    const matchingPosts = posts.filter((item) => item.establishmentId === id);
    const matchingGallery = gallery.filter((item) => item.establishmentId === id);
    const matchingMenu = menuItems.filter((item) => item.establishmentId === id);
    const matchingVouchers = vouchers.filter((item) => item.establishmentId === id);
    const uploadedImages = [
      ...matchingGallery.map((item) => item.imageUrl),
      ...matchingPosts.flatMap((item) => item.imageUrls),
    ].filter(Boolean);

    return {
      ...profile,
      image: profile.imageUrls?.[0] || uploadedImages[0] || profile.image || null,
      imageUrls: Array.from(new Set([...(profile.imageUrls || []), ...uploadedImages].filter(Boolean))),
      posts: matchingPosts,
      gallery: matchingGallery,
      menuItems: matchingMenu,
      vouchers: matchingVouchers,
    };
  });
}

export function formatPublishedDate(value) {
  const date = toDate(value);
  if (!date) return 'Recently';
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toMillis(value) {
  return toDate(value)?.getTime() || 0;
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanImageUrls(values) {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map(cleanImageUrl).filter(Boolean)));
}

function cleanImageUrl(value) {
  const url = String(value || '').trim();
  return /^(https?:\/\/|data:image\/|blob:)/i.test(url) ? url : '';
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 });
}
