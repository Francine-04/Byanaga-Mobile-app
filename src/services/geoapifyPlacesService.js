import AsyncStorage from '@react-native-async-storage/async-storage';
import { NAGA_BOUNDS, isCoordinateInsideNagaCity } from '../utils/nagaBoundary';

const CACHE_KEY = 'byanaga.geoapify.naga.v5';
const categories = 'accommodation,catering,natural,leisure.park,tourism,entertainment,religion,commercial';
const categoryGroups = [categories, 'commercial.shopping_mall,commercial.department_store,commercial.supermarket,commercial.marketplace',
  'entertainment.museum,entertainment.culture,tourism.sights,tourism.attraction.artwork,building.historic',
  'catering.restaurant,catering.cafe,catering.fast_food,catering.food_court,catering.ice_cream',
  'religion.place_of_worship,tourism.sights.place_of_worship',
  'activity.events_venue,tourism.sights.conference_centre'];
let pending;

export function normalizeGeoapifyPlace(feature) {
  const p = feature.properties || {};
  const longitude = p.lon ?? feature.geometry?.coordinates?.[0];
  const latitude = p.lat ?? feature.geometry?.coordinates?.[1];
  if (!p.name || !p.place_id || !isCoordinateInsideNagaCity(latitude, longitude)) return null;
  const tags = p.categories || [];
  const has = (prefix) => tags.some((tag) => tag === prefix || tag.startsWith(`${prefix}.`));
  const isMall = has('commercial.shopping_mall');
  const isWorship = has('religion.place_of_worship') || has('tourism.sights.place_of_worship');
  const isEventVenue = has('activity.events_venue') || has('tourism.sights.conference_centre');
  const isHistorical = has('building.historic') || has('tourism.sights.memorial') || has('tourism.sights.archaeological_site') || has('tourism.sights.ruines') || has('tourism.sights.fort') || has('tourism.sights.battlefield');
  const foodType = has('catering.restaurant') ? 'Restaurant' : has('catering.cafe') ? 'Café'
    : has('catering.fast_food') ? 'Fast Food' : has('catering.food_court') ? 'Food Court'
    : has('catering.ice_cream') ? 'Ice Cream Shop' : null;
  const cultureType = has('entertainment.museum') ? 'Museum'
    : has('entertainment.culture.gallery') ? 'Art Gallery'
    : has('entertainment.culture.theatre') ? 'Theatre'
    : has('entertainment.culture') ? 'Arts Venue'
    : has('tourism.sights') || has('building.historic') ? 'Heritage Landmark'
    : has('tourism.attraction.artwork') ? 'Public Artwork' : null;
  const category = isWorship ? 'Church' : isEventVenue ? 'Event Venues' : isMall ? 'Shopping' : has('accommodation') ? 'Accommodation' : has('catering') ? 'Food'
    : has('natural') || has('leisure.park') ? 'Nature' : has('religion') ? 'Church'
    : has('commercial') ? 'Shopping' : isHistorical ? 'Historical' : cultureType ? 'Culture' : has('entertainment') ? 'Entertainment' : 'Culture';
  return {
    id: `geoapify-${p.place_id}`, name: p.name, category, tags: [...new Set([category, ...(isMall ? ['Mall'] : []), ...(cultureType ? ['Culture', cultureType] : []), ...(isHistorical ? ['Historical'] : []), ...(foodType ? [foodType] : [])])], latitude, longitude,
    typeLabel: isWorship ? 'Place of Worship' : isEventVenue ? 'Event Venue' : foodType || cultureType || category,
    source: 'geoapify', sourceCollection: 'geoapify', address: p.formatted || 'Naga City, Camarines Sur',
    description: `${p.name} is listed as ${isWorship ? 'a place of worship' : isEventVenue ? 'an event venue' : isMall ? 'a shopping mall' : foodType ? `a food venue (${foodType.toLowerCase()})` : isHistorical ? 'a historical landmark' : cultureType ? `a cultural site (${cultureType.toLowerCase()})` : `a ${category.toLowerCase()} place`} in Naga City, Camarines Sur. ${isEventVenue ? 'This is a venue listing, not a scheduled event. Contact the venue for upcoming programs.' : isWorship ? 'Confirm service times and visitor access with the place of worship.' : 'Check with the venue for current visiting details.'}`,
    image: null, photos: [], rating: null, ratingCount: 0, visitCount: 0,
    distance: 'Naga City', estimatedVisitTime: 'Not listed',
    openingHours: 'Not provided', operatingHours: [], entranceFee: 'Not provided',
    price: 'Price not provided', priceRange: 'Price not provided', cuisine: 'Cuisine not provided',
    amenities: [], crowdLevel: 'Unknown', isActive: true,
  };
}

export function fetchGeoapifyPlaces() {
  if (!pending) pending = loadPlaces().finally(() => { pending = null; });
  return pending;
}

async function loadPlaces() {
  let cached;
  try { cached = JSON.parse(await AsyncStorage.getItem(CACHE_KEY)); } catch {}
  if (Array.isArray(cached?.places) && Date.now() - cached.updatedAt < 86400000) return cached.places;
  const key = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!key) throw new Error('Geoapify Places is not configured.');
  const bounds = NAGA_BOUNDS;
  const places = new Map();
  try {
    // Bounded pagination limits API usage; polygon validation excludes neighboring towns.
    // A dedicated shopping query keeps malls from being crowded out by other categories.
    for (const categoryGroup of categoryGroups) {
    for (let offset = 0; offset < 1500; offset += 500) {
      const params = new URLSearchParams({ categories: categoryGroup,
        filter: `rect:${bounds.minLongitude},${bounds.minLatitude},${bounds.maxLongitude},${bounds.maxLatitude}`,
        limit: '500', offset: String(offset), apiKey: key });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(`https://api.geoapify.com/v2/places?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Geoapify places are temporarily unavailable.');
        const payload = await response.json();
        if (!Array.isArray(payload.features)) throw new Error('Invalid Geoapify places response.');
        payload.features.map(normalizeGeoapifyPlace).filter(Boolean).forEach((place) => places.set(place.id, place));
        if (payload.features.length < 500) break;
      } finally { clearTimeout(timer); }
    }
    }
    const result = [...places.values()];
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ updatedAt: Date.now(), places: result })).catch(() => {});
    return result;
  } catch {
    if (Array.isArray(cached?.places)) return cached.places;
    throw new Error('Geoapify places are temporarily unavailable.');
  }
}
