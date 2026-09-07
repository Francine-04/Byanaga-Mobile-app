import { NAGA_BOUNDS, NAGA_CENTER, isCoordinateInsideNagaCity, isValidCoordinate } from '../utils/nagaBoundary';
import { getPlaceImage } from '../data/placeImages';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';

const PROXIMITY = `${NAGA_CENTER.longitude},${NAGA_CENTER.latitude}`;
const BBOX = [
  NAGA_BOUNDS.minLongitude,
  NAGA_BOUNDS.minLatitude,
  NAGA_BOUNDS.maxLongitude,
  NAGA_BOUNDS.maxLatitude,
].join(',');

const CATEGORY_TERMS = {
  All: ['tourist attraction', 'church', 'restaurant', 'hotel', 'park', 'museum', 'mall', 'event venue'],
  Nature: ['park', 'nature attraction', 'ecological park'],
  Church: ['church', 'basilica', 'cathedral', 'chapel'],
  Culture: ['museum', 'heritage landmark', 'historical landmark', 'tourist attraction'],
  Food: ['restaurant', 'cafe', 'food'],
  Shopping: ['mall', 'shopping center', 'store'],
  Accommodation: ['hotel', 'resort', 'inn', 'accommodation'],
  Events: ['event venue', 'coliseum', 'civic center', 'convention'],
};

export function hasMapboxAccessToken() {
  return Boolean(MAPBOX_ACCESS_TOKEN);
}

export function getMapboxAccessToken() {
  return MAPBOX_ACCESS_TOKEN || null;
}

export function getMapboxStyleUrl() {
  return MAPBOX_STYLE_URL;
}

export async function searchMapboxPlaces({ query = '', category = 'All', limit = 12 } = {}) {
  if (!MAPBOX_ACCESS_TOKEN) {
    throw new Error('Mapbox access token is missing. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.');
  }

  const trimmedQuery = String(query || '').trim();
  const searchLimit = Math.max(Number(limit) || 12, 12);
  const searchTexts = getSearchTexts(trimmedQuery, category).slice(0, 8);
  const requests = searchTexts.map((searchText) => fetchGeocodingFeatures({ searchText, limit: searchLimit }));
  const responses = await Promise.allSettled(requests);
  const features = responses.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const failed = responses.filter((result) => result.status === 'rejected');

  if (!features.length && failed.length === responses.length) {
    const reason = failed[0]?.reason?.message || 'Mapbox search failed. Please try again.';
    throw new Error(reason);
  }

  return dedupePlaces(features.map((feature) => normalizeMapboxFeature(feature, category, Boolean(trimmedQuery))).filter(Boolean))
    .filter((place) => isCoordinateInsideNagaCity(place.latitude, place.longitude))
    .slice(0, limit);
}

async function fetchGeocodingFeatures({ searchText, limit }) {
  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    autocomplete: 'true',
    bbox: BBOX,
    country: 'ph',
    language: 'en',
    limit: String(Math.min(limit, 10)),
    proximity: PROXIMITY,
    types: 'poi,address',
  });

  const payload = await fetchMapboxJson(`${MAPBOX_GEOCODING_URL}/${encodeURIComponent(searchText)}.json?${params.toString()}`);
  const features = Array.isArray(payload?.features) ? payload.features : [];
  return features;
}

async function fetchMapboxJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox search failed (${response.status}). Please try again.`);
  }

  return response.json();
}

function getSearchTexts(query, category) {
  const categoryTerms = CATEGORY_TERMS[category] || CATEGORY_TERMS.All;

  if (query) {
    const terms = category === 'All' ? [query] : [query, ...categoryTerms.map((term) => `${query} ${term}`)];
    return terms.map(buildNagaSearchText);
  }

  return categoryTerms.map(buildNagaSearchText);
}

function buildNagaSearchText(value) {
  const baseText = String(value || '').trim() || 'tourist destination';
  const normalized = baseText.toLowerCase();

  if (normalized.includes('naga') || normalized.includes('camarines')) {
    return baseText;
  }

  return `${baseText}, Naga City, Camarines Sur, Philippines`;
}

function normalizeMapboxFeature(feature, selectedCategory, hasQuery) {
  if (!isUsablePlaceFeature(feature, hasQuery)) {
    return null;
  }

  const coordinates = Array.isArray(feature?.center) ? feature.center : feature?.geometry?.coordinates;
  const longitude = toNumber(coordinates?.[0]);
  const latitude = toNumber(coordinates?.[1]);

  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  const properties = feature?.properties || {};
  const context = Array.isArray(feature?.context) ? feature.context : [];
  const placeId = String(feature?.id || properties.mapbox_id || `${latitude.toFixed(6)},${longitude.toFixed(6)}`);
  const name = cleanText(feature?.text || properties.name || feature?.place_name || 'Unnamed destination');
  const address = cleanText(feature?.place_name || context.map((item) => item.text).filter(Boolean).join(', ') || 'Naga City, Camarines Sur');
  const category = selectedCategory === 'All' ? inferCategory(feature) : selectedCategory;

  return {
    id: `mapbox-${placeId}`,
    placeId,
    mapboxPlaceId: placeId,
    name,
    address,
    latitude,
    longitude,
    category,
    categories: [category],
    image: getPlaceImage({ name, category }),
    source: 'mapbox',
  };
}

function isUsablePlaceFeature(feature, hasQuery) {
  const types = Array.isArray(feature?.place_type) ? feature.place_type : [];
  const hasPoi = types.includes('poi');
  const hasAddress = types.includes('address');
  const text = cleanText(feature?.text || '').toLowerCase();

  if (hasPoi) {
    return true;
  }

  if (!hasQuery || !hasAddress) {
    return false;
  }

  return !['naga city', 'naga', 'camarines sur'].includes(text);
}

function inferCategory(feature) {
  const haystack = [
    feature?.text,
    feature?.place_name,
    feature?.properties?.category,
    feature?.properties?.maki,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (haystack.includes('restaurant') || haystack.includes('cafe') || haystack.includes('food')) return 'Food';
  if (haystack.includes('hotel') || haystack.includes('lodging') || haystack.includes('accommodation')) return 'Accommodation';
  if (haystack.includes('mall') || haystack.includes('shop') || haystack.includes('store')) return 'Shopping';
  if (haystack.includes('park') || haystack.includes('nature')) return 'Nature';
  if (haystack.includes('church') || haystack.includes('basilica') || haystack.includes('cathedral') || haystack.includes('chapel')) return 'Church';
  if (haystack.includes('event') || haystack.includes('venue')) return 'Events';
  return 'Culture';
}

function dedupePlaces(places) {
  const seen = new Set();

  return places.filter((place) => {
    const key = `${place.placeId}-${place.name}-${place.latitude.toFixed(5)}-${place.longitude.toFixed(5)}`;
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
