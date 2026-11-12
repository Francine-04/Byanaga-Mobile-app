import { findKnownPlace, nagaPlaces, normalizePlaceKey } from '../data/nagaPlaces';
import { isCoordinateInsideNagaCity } from './nagaBoundary';

const NAGA_BOUNDS = {
  minLatitude: 13.615,
  maxLatitude: 13.655,
  minLongitude: 123.18,
  maxLongitude: 123.215,
};

export function deriveHeatZones({ visitors = [], destinations = [], events = [] } = {}) {
  const counts = new Map();

  visitors.forEach((visitor) => {
    visitor.visitedDestinations?.forEach((value) => {
      const place = findDashboardOrKnownPlace(value, destinations);
      if (!place || !isCoordinateInsideNagaCity(place.latitude, place.longitude)) return;
      const key = normalizePlaceKey(place.name || place.id);
      counts.set(key, {
        place,
        count: (counts.get(key)?.count || 0) + 1,
      });
    });
  });

  if (!counts.size) {
    destinations.forEach((destination) => {
      const visitCount = Number(destination.visitCount || 0);
      if (!Number.isFinite(visitCount) || visitCount <= 0) return;
      const place = findDashboardOrKnownPlace(destination.name || destination.dashboardId || destination.id, destinations);
      if (!place || !isCoordinateInsideNagaCity(place.latitude, place.longitude)) return;
      const key = normalizePlaceKey(place.name || place.id);
      counts.set(key, { place, count: visitCount });
    });
  }

  events.forEach((event) => {
    const attendance = Number(event.actualAttendance || 0);
    const latitude = Number(event.locationLat);
    const longitude = Number(event.locationLng);
    if (!Number.isFinite(attendance) || attendance <= 0 || !isCoordinateInsideNagaCity(latitude, longitude)) return;

    const place = {
      id: event.id,
      name: event.location || event.title,
      category: event.locationCategory || 'Events',
      latitude,
      longitude,
    };
    const key = `event-${normalizePlaceKey(event.id)}`;
    counts.set(key, { place, count: attendance });
  });

  destinations.forEach((place) => {
    if (!isCoordinateInsideNagaCity(place.latitude, place.longitude)) return;
    const key = normalizePlaceKey(place.name || place.id);
    if (!counts.has(key)) counts.set(key, { place, count: null });
  });

  const maxCount = Math.max(0, ...Array.from(counts.values()).map((item) => item.count || 0));

  return Array.from(counts.values())
    .map(({ place, count }) => {
      const ratio = maxCount ? count / maxCount : 0;
      const level = count == null ? { label: 'Unknown', colorKey: 'unknown' } : ratioToLevel(ratio);

      return {
        id: `heat-${normalizePlaceKey(place.id || place.name)}`,
        destination: place,
        label: shortPlaceName(place.name),
        level: level.label,
        colorKey: level.colorKey,
        top: latitudeToTop(place.latitude),
        left: longitudeToLeft(place.longitude),
        latitude: place.latitude,
        longitude: place.longitude,
        size: count == null ? 16 : Math.round(72 + ratio * 48),
        peakHours: 'Not available',
        bestTime: 'Not available',
        alternative: 'Browse Explore for alternatives',
        nearbyCount: null,
        count,
        source: 'dashboard',
      };
    })
    .sort((a, b) => (b.count || 0) - (a.count || 0));
}

export function zonesToMarkers(zones = []) {
  return zones.map((zone) => ({
    id: `marker-${zone.id}`,
    name: zone.label,
    top: zone.top,
    left: zone.left,
    latitude: zone.latitude,
    longitude: zone.longitude,
  }));
}

export function fiveAreaPreview(destinations = []) {
  const levels = [{ label: 'Low', colorKey: 'low' }, { label: 'Moderate', colorKey: 'moderate' }, { label: 'Busy', colorKey: 'busy' }, { label: 'Crowded', colorKey: 'crowded' }, { label: 'Low', colorKey: 'low' }];
  const seen = new Set();
  return destinations.filter((place) => {
    if (!isCoordinateInsideNagaCity(place.latitude, place.longitude)) return false;
    const key = `${Number(place.latitude).toFixed(3)},${Number(place.longitude).toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 5).map((place, index) => ({
    id: `preview-${place.id}`, destination: place, label: place.name,
    ...levels[index], latitude: place.latitude, longitude: place.longitude,
    size: 90, count: null, source: 'demo',
  }));
}

function findDashboardOrKnownPlace(value, destinations) {
  const normalized = normalizePlaceKey(value);
  if (!normalized) return null;

  const dashboard = destinations.find((destination) => {
    return (
      normalizePlaceKey(destination.dashboardId) === normalized ||
      normalizePlaceKey(destination.id) === normalized ||
      normalizePlaceKey(destination.name) === normalized
    );
  });

  if (dashboard?.latitude && dashboard?.longitude) return dashboard;

  const known = findKnownPlace(value);
  if (known) return known;

  return dashboard?.latitude && dashboard?.longitude ? dashboard : null;
}

function ratioToLevel(ratio) {
  if (ratio >= 0.85) return { label: 'Crowded', colorKey: 'crowded' };
  if (ratio >= 0.58) return { label: 'Busy', colorKey: 'busy' };
  if (ratio >= 0.3) return { label: 'Moderate', colorKey: 'moderate' };
  return { label: 'Low', colorKey: 'low' };
}

function latitudeToTop(latitude) {
  const value = clamp((NAGA_BOUNDS.maxLatitude - latitude) / (NAGA_BOUNDS.maxLatitude - NAGA_BOUNDS.minLatitude), 0.08, 0.82);
  return `${Math.round(value * 100)}%`;
}

function longitudeToLeft(longitude) {
  const value = clamp((longitude - NAGA_BOUNDS.minLongitude) / (NAGA_BOUNDS.maxLongitude - NAGA_BOUNDS.minLongitude), 0.08, 0.82);
  return `${Math.round(value * 100)}%`;
}

function findAlternative(place, destinations) {
  const currentKey = normalizePlaceKey(place.name);
  const options = destinations.filter((destination) => {
    if (normalizePlaceKey(destination.name) === currentKey) return false;
    return destination.crowdLevel === 'Low' || destination.crowdLevel === 'Moderate';
  });

  return options[0]?.name || nagaPlaces.find((known) => normalizePlaceKey(known.name) !== currentKey)?.name || 'Explore nearby places';
}

function shortPlaceName(name) {
  return String(name || 'Naga City')
    .replace('Conciliar de Nueva Caceres', '')
    .replace('Minore', '')
    .trim();
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(max, Math.max(min, value));
}
