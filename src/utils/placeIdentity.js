import { findKnownPlace, normalizePlaceKey } from '../data/nagaPlaces';

export function resolveByanagaPlaceId(place, collections = {}) {
  const candidates = [
    ...(collections.destinations || []),
    ...(collections.restaurants || []),
    ...(collections.accommodations || []),
    ...(collections.events || []),
  ];
  const placeKey = normalizePlaceKey(place?.name);
  const addressKey = normalizePlaceKey(place?.address);

  const directMatch = candidates.find((item) => {
    const itemNameKey = normalizePlaceKey(item?.name || item?.title);
    const itemAddressKey = normalizePlaceKey(item?.address);

    return (
      Boolean(placeKey && itemNameKey && (itemNameKey === placeKey || itemNameKey.includes(placeKey) || placeKey.includes(itemNameKey))) ||
      Boolean(addressKey && itemAddressKey && (itemAddressKey === addressKey || itemAddressKey.includes(addressKey) || addressKey.includes(itemAddressKey)))
    );
  });

  if (directMatch) {
    return directMatch.dashboardId || directMatch.id;
  }

  const knownPlace = findKnownPlace(place?.name) || findKnownPlace(place?.address);
  return knownPlace?.id || place?.placeId || place?.id || null;
}
