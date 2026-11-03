import { isCoordinateInsideNagaCity } from './nagaBoundary';
export function liveCrowdZones(destinations, snapshot, now = Date.now()) {
  if (!snapshot?.updatedAt || now - snapshot.updatedAt > 120000 || snapshot.updatedAt > now + 60000) return [];
  const labels = { low: 'Low', moderate: 'Moderate', busy: 'Busy', crowded: 'Crowded' };
  return destinations.flatMap((place) => {
    const id = encodeURIComponent(String(place.dashboardId || place.id)).replace(/\./g, '%2E');
    const data = snapshot.places?.[id];
    if (!data || !labels[data.level] || !isCoordinateInsideNagaCity(place.latitude, place.longitude)) return [];
    return [{ id, destination: place, label: place.name, level: labels[data.level], colorKey: data.level,
      latitude: place.latitude, longitude: place.longitude, count: data.count, capacity: data.capacity,
      size: 48 + Math.min(1, data.count / data.capacity) * 72 }];
  });
}
