// Collapse duplicate listings, not separate branches. No database records are deleted.
const aliases = new Map([
  ['nagametropolitancathedral', 'metropolitancathedralofstjohntheevangelist'],
  ['penafranciabasilicaminore', 'minorbasilicaandnationalshrineofourladyofpenafrancia'],
  ['nagaecologicalpark', 'nagacityecologypark'],
  ['ourladyofpenafranciashrine', 'shrineandparishofourladyofpenafrancia'],
  ['robetsonmall', 'robertsonmall'],
  // Alternate catalog names for the same sites (coordinates checked).
  ['quincemartires', 'plazaquincemartires'],
  ['emall', 'robinsonsemall'],
  ['nagalandemall', 'robinsonsemall'],
  ['lccmall', 'lccmallnaga'],
]);
function nameKey(value) {
  const key = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&|\+/g, 'and').replace(/[^a-z0-9]/g, '');
  return aliases.get(key) || key;
}
function coordinates(place) {
  const rawLat = place.latitude, rawLon = place.longitude;
  if (rawLat == null || rawLon == null || rawLat === '' || rawLon === '') return null;
  const lat = Number(rawLat), lon = Number(rawLon);
  return typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)
    ? [lat, lon] : null;
}
function addressKey(value) {
  const key = nameKey(value);
  // City-only fallback labels do not identify a distinct branch.
  return ['nagacity', 'nagacitycamarinessur', 'nagacitycamarinessurphilippines', 'notprovided'].includes(key) ? '' : key;
}
function samePlace(a, b) {
  if (a.id && a.id === b.id) return true;
  const aBusiness = a.dashboardId || a.establishmentId;
  const bBusiness = b.dashboardId || b.establishmentId;
  if (aBusiness && bBusiness && aBusiness === bBusiness) return true;
  const name = nameKey(a.name || a.title);
  if (!name || name !== nameKey(b.name || b.title)) return false;
  const ac = coordinates(a), bc = coordinates(b);
  if (ac && bc) {
    const dy = (ac[0] - bc[0]) * 111320;
    const dx = (ac[1] - bc[1]) * 111320 * Math.cos(ac[0] * Math.PI / 180);
    return Math.hypot(dx, dy) <= 100;
  }
  const aa = addressKey(a.address), ba = addressKey(b.address);
  if (aa && ba && aa !== ba) return false;
  // Matching names with no distinguishing location are duplicate display rows.
  return true;
}
export function dedupePlaces(items = []) {
  const unique = [];
  for (const item of items) {
    if (!item) continue;
    const index = unique.findIndex((existing) => samePlace(existing, item));
    if (index < 0) unique.push(item);
    else {
      const existing = unique[index];
      // Keep the preferred record's identity/navigation and fill missing media
      // and coordinates so deduplication does not discard a useful photo.
      unique[index] = {
        ...existing,
        image: existing.image || item.image,
        latitude: existing.latitude ?? item.latitude,
        longitude: existing.longitude ?? item.longitude,
        tags: [...new Set([...(existing.tags || []), ...(item.tags || []), existing.category, item.category].filter(Boolean))],
      };
    }
  }
  return unique;
}
