import { nagaPlaces, findKnownPlace, normalizePlaceKey } from '../data/nagaPlaces';
import { isCoordinateInsideNagaCity, isValidCoordinate } from './nagaBoundary';

export const NAGA_PLACE_CATEGORIES = ['All', 'Nature', 'Church', 'Culture', 'Food', 'Shopping', 'Accommodation', 'Events'];

export function searchNagaCatalogPlaces({ query = '', category = 'All', collections = {}, limit = 30 } = {}) {
  const normalizedQuery = normalizePlaceKey(query);
  const candidates = [
    ...nagaPlaces.map((place) => normalizeKnownPlace(place)),
    ...(collections.destinations || []).map((place) => normalizeCollectionPlace(place, 'destination')),
    ...(collections.restaurants || []).map((place) => normalizeCollectionPlace(place, 'restaurant')),
    ...(collections.accommodations || []).map((place) => normalizeCollectionPlace(place, 'accommodation')),
    ...(collections.events || []).map((place) => normalizeCollectionPlace(place, 'event')),
  ].filter(Boolean);

  return dedupePlaces(candidates)
    .filter((place) => category === 'All' || place.category === normalizeCategory(category))
    .filter((place) => matchesQuery(place, normalizedQuery))
    .sort((first, second) => scorePlace(second, normalizedQuery) - scorePlace(first, normalizedQuery) || first.name.localeCompare(second.name))
    .slice(0, limit);
}

export function mergeNagaPlaceResults(...groups) {
  const maybeLimit = groups[groups.length - 1];
  const limit = typeof maybeLimit === 'number' ? groups.pop() : 30;

  return dedupePlaces(groups.flat().filter(Boolean)).slice(0, limit);
}

function normalizeKnownPlace(place) {
  return normalizePlace({
    id: place.id,
    placeId: place.id,
    name: place.name,
    address: place.address || 'Naga City, Camarines Sur',
    category: place.category,
    latitude: place.latitude,
    longitude: place.longitude,
    aliases: place.aliases,
    source: 'byanaga-naga-catalog',
  });
}

function normalizeCollectionPlace(item, type) {
  const name = item?.name || item?.title;
  const address = item?.address || item?.venue || item?.location || 'Naga City, Camarines Sur';
  const knownPlace = findKnownPlace(name) || findKnownPlace(address) || findKnownPlace(item?.dashboardId || item?.id);
  const category = inferCollectionCategory(item, type, knownPlace);

  return normalizePlace({
    id: item?.id || item?.dashboardId || knownPlace?.id,
    placeId: item?.dashboardId || item?.id || knownPlace?.id,
    name,
    address,
    category,
    latitude: item?.latitude ?? item?.locationLat ?? item?.lat ?? knownPlace?.latitude,
    longitude: item?.longitude ?? item?.locationLng ?? item?.lng ?? knownPlace?.longitude,
    aliases: knownPlace?.aliases,
    dashboardId: item?.dashboardId,
    mapboxPlaceId: item?.mapboxPlaceId,
    rating: item?.rating,
    source: item?.source || `byanaga-${type}`,
    tags: [
      ...(Array.isArray(item?.tags) ? item.tags : []),
      item?.cuisine,
      item?.amenities,
      item?.typeLabel,
      item?.category,
    ].filter(Boolean),
  });
}

function normalizePlace(place) {
  const latitude = toNumber(place.latitude);
  const longitude = toNumber(place.longitude);

  if (!place.name || !isValidCoordinate(latitude, longitude) || !isCoordinateInsideNagaCity(latitude, longitude)) {
    return null;
  }

  const category = normalizeCategory(place.category);
  if (!category || category === 'Other') {
    return null;
  }

  return {
    id: `naga-${place.placeId || place.id || normalizePlaceKey(place.name)}`,
    placeId: String(place.placeId || place.id || normalizePlaceKey(place.name)),
    dashboardId: place.dashboardId,
    mapboxPlaceId: place.mapboxPlaceId,
    name: cleanText(place.name),
    address: cleanText(place.address || 'Naga City, Camarines Sur'),
    latitude,
    longitude,
    category,
    categories: [category],
    aliases: place.aliases || [],
    rating: place.rating,
    source: place.source || 'byanaga',
    searchableText: [
      place.name,
      place.address,
      category,
      ...(place.aliases || []),
      ...(place.tags || []),
    ]
      .map(normalizePlaceKey)
      .filter(Boolean)
      .join(' '),
  };
}

function inferCollectionCategory(item, type, knownPlace) {
  if (type === 'restaurant') return 'Food';
  if (type === 'accommodation') return 'Accommodation';
  if (type === 'event') return 'Events';
  return item?.category || knownPlace?.category || 'Culture';
}

function normalizeCategory(value) {
  const key = normalizePlaceKey(value);

  if (!key) return null;
  if (key.includes('nature') || key.includes('park')) return 'Nature';
  if (key.includes('church') || key.includes('religious') || key.includes('worship') || key.includes('basilica') || key.includes('cathedral')) return 'Church';
  if (key.includes('food') || key.includes('restaurant') || key.includes('cafe')) return 'Food';
  if (key.includes('shopping') || key.includes('shop') || key.includes('mall')) return 'Shopping';
  if (key.includes('accommodation') || key.includes('hotel') || key.includes('resort') || key.includes('stay') || key.includes('inn')) return 'Accommodation';
  if (key.includes('event') || key.includes('venue') || key.includes('coliseum') || key.includes('civic')) return 'Events';
  if (key.includes('culture') || key.includes('museum') || key.includes('historical') || key.includes('heritage') || key.includes('landmark') || key.includes('government')) return 'Culture';
  return 'Other';
}

function matchesQuery(place, normalizedQuery) {
  if (!normalizedQuery) {
    return true;
  }

  const tokens = normalizedQuery.split('-').filter(Boolean);
  return tokens.every((token) => place.searchableText.includes(token));
}

function scorePlace(place, normalizedQuery) {
  let score = 0;
  const nameKey = normalizePlaceKey(place.name);

  if (normalizedQuery && nameKey === normalizedQuery) score += 30;
  if (normalizedQuery && nameKey.includes(normalizedQuery)) score += 20;
  if (place.source === 'dashboard') score += 12;
  if (String(place.source || '').includes('dashboard')) score += 8;
  if (String(place.source || '').includes('byanaga')) score += 5;
  if (place.rating) score += Math.min(Number(place.rating) || 0, 5);

  return score;
}

function dedupePlaces(places) {
  const seen = new Set();

  return places.filter((place) => {
    const key = `${normalizePlaceKey(place.name)}-${place.latitude.toFixed(5)}-${place.longitude.toFixed(5)}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
