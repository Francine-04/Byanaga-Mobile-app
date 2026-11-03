import { isCoordinateInsideNagaCity } from './nagaBoundary';

export const TOURISM_CATEGORIES = ['Nature', 'Church', 'Culture', 'Historical', 'Food', 'Shopping', 'Accommodation'];
export const DETECTION = { maxAccuracy: 25, readings: 3, confirmMs: 10000, maxGapMs: 20000, maxAgeMs: 15000, exitMargin: 40, maxSpeed: 12 };
export const placeKey = (place) => encodeURIComponent(String(place.dashboardId || place.id)).replace(/\./g, '%2E');
export function tourismCategory(value) {
  const key = String(value || '').toLowerCase();
  const aliases = { nature: 'Nature', church: 'Church', churches: 'Church', culture: 'Culture', entertainment: 'Culture', historical: 'Historical', food: 'Food', restaurant: 'Food', shopping: 'Shopping', shop: 'Shopping', accommodation: 'Accommodation', hotel: 'Accommodation' };
  return aliases[key] || null;
}
export function registeredPlaces(configs = {}) {
  return Object.entries(configs).flatMap(([id, p]) => p.enabled === true && p.automaticEnabled === true && tourismCategory(p.category) && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && isCoordinateInsideNagaCity(p.latitude, p.longitude)
    ? [{ ...p, id, category: tourismCategory(p.category), radius: Math.max(30, Math.min(150, Number(p.radius) || 70)) }] : []);
}
export function distanceMeters(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad, dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

// Pure detector. Only confirmed server transitions change persistent state.
export function createVisitDetector(places, options = {}) {
  const policy = { ...DETECTION, ...options };
  let previous = null;
  const streaks = new Map();
  const reset = () => { previous = null; streaks.clear(); };
  return { reset, sample(reading, states = {}, now = Date.now()) {
    const c = reading?.coords, t = reading?.timestamp;
    if (!c || !Number.isFinite(t) || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude) || Math.abs(c.latitude) > 90 || Math.abs(c.longitude) > 180 || !Number.isFinite(c.accuracy) || c.accuracy < 0 || c.accuracy > policy.maxAccuracy || now - t > policy.maxAgeMs || t > now + 2000 || c.mocked || reading.mocked || (c.speed != null && c.speed > policy.maxSpeed)) { reset(); return []; }
    if (previous && t <= previous.timestamp) return [];
    if (previous && t - previous.timestamp > policy.maxGapMs) streaks.clear();
    if (previous && distanceMeters(c, previous.coords) > (t - previous.timestamp) / 1000 * policy.maxSpeed + c.accuracy + previous.coords.accuracy) { reset(); return []; }
    previous = reading;
    const candidates = places.filter((p) => distanceMeters(c, p) + c.accuracy <= p.radius);
    // Overlapping geofences are ambiguous: never credit several nearby venues.
    const arrival = candidates.length === 1 ? candidates[0] : null;
    const events = [];
    for (const place of places) {
      const inside = states[place.id]?.phase === 'inside';
      const transition = inside
        ? (distanceMeters(c, place) - c.accuracy > place.radius + policy.exitMargin ? 'outside' : null)
        : (arrival?.id === place.id ? 'inside' : null);
      if (!transition) { streaks.delete(place.id); continue; }
      const old = streaks.get(place.id);
      const streak = old?.phase === transition ? { ...old, count: old.count + 1 } : { phase: transition, count: 1, since: t };
      streaks.set(place.id, streak);
      if (streak.count >= policy.readings && t - streak.since >= policy.confirmMs) {
        events.push({ placeId: place.id, phase: transition });
        streaks.delete(place.id);
      }
    }
    // Departures are committed first if moving between destinations.
    return events.sort((a, b) => (a.phase === 'outside' ? -1 : 1) - (b.phase === 'outside' ? -1 : 1));
  } };
}

export function dateDayKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? String(Math.floor(time / 86400000)) : null;
}
export function activityLevel(count, thresholds) {
  if (!thresholds || ![thresholds.moderate, thresholds.busy, thresholds.crowded].every(Number.isSafeInteger) || !(thresholds.moderate > 0 && thresholds.busy > thresholds.moderate && thresholds.crowded > thresholds.busy)) return null;
  return count >= thresholds.crowded ? 'Crowded' : count >= thresholds.busy ? 'Busy' : count >= thresholds.moderate ? 'Moderate' : 'Low';
}
export function activityZones(places, days, thresholds, category = 'All', level = 'All') {
  const counts = {};
  Object.values(days || {}).forEach((day) => Object.entries(day || {}).forEach(([id, count]) => { if (Number.isSafeInteger(count) && count >= 0) counts[id] = (counts[id] || 0) + count; }));
  return places.flatMap((p) => {
    const count = counts[p.id] || 0, label = activityLevel(count, thresholds);
    if (!label || (category !== 'All' && p.category !== category) || (level !== 'All' && label !== level)) return [];
    return [{ id: p.id, destination: p, label: p.name, latitude: p.latitude, longitude: p.longitude, count, level: label, colorKey: label.toLowerCase(), size: 35 + Math.min(60, count * 2), source: 'automatic' }];
  }).sort((a, b) => b.count - a.count);
}
