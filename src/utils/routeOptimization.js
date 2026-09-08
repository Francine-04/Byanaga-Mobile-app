import { NAGA_CENTER } from './nagaBoundary';

export function distanceKm(a, b) {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLng = radians(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(Math.max(0, 1 - value)));
}

// A nearest-stop heuristic uses straight-line distances, not driving times.
export function optimizeRoute(stops, start = NAGA_CENTER) {
  const remaining = [...stops];
  const ordered = [];
  let previous = start;
  while (remaining.length) {
    let nextIndex = 0;
    remaining.forEach((stop, index) => {
      if (distanceKm(previous, stop) < distanceKm(previous, remaining[nextIndex])) nextIndex = index;
    });
    const [stop] = remaining.splice(nextIndex, 1);
    ordered.push({ ...stop, routeOrder: ordered.length + 1 });
    previous = stop;
  }
  return ordered;
}
