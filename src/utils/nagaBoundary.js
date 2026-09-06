import boundaryFeature from '../data/naga-city-boundary.json';

export const NAGA_CENTER = {
  latitude: 13.6240122,
  longitude: 123.1850318,
};

export const NAGA_BOUNDS = {
  minLatitude: 13.6023285,
  maxLatitude: 13.6743613,
  minLongitude: 123.1733722,
  maxLongitude: 123.3764733,
};

export const OUTSIDE_NAGA_MESSAGE = 'This destination is outside Naga City and cannot be added to your itinerary.';

export function getNagaBoundaryFeature() {
  return boundaryFeature;
}

export function isValidCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isCoordinateInsideNagaCity(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!isValidCoordinate(lat, lng)) {
    return false;
  }

  if (
    lat < NAGA_BOUNDS.minLatitude ||
    lat > NAGA_BOUNDS.maxLatitude ||
    lng < NAGA_BOUNDS.minLongitude ||
    lng > NAGA_BOUNDS.maxLongitude
  ) {
    return false;
  }

  const geometry = boundaryFeature?.geometry || boundaryFeature?.features?.[0]?.geometry;
  if (!geometry) {
    return false;
  }

  return geometryContainsPoint(geometry, lng, lat);
}

export function assertInsideNagaCity(place) {
  if (!isCoordinateInsideNagaCity(place?.latitude, place?.longitude)) {
    throw new Error(OUTSIDE_NAGA_MESSAGE);
  }
}

function geometryContainsPoint(geometry, longitude, latitude) {
  if (geometry.type === 'Polygon') {
    return polygonContainsPoint(geometry.coordinates, longitude, latitude);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => polygonContainsPoint(polygon, longitude, latitude));
  }

  return false;
}

function polygonContainsPoint(rings, longitude, latitude) {
  if (!Array.isArray(rings) || !rings.length) {
    return false;
  }

  const insideOuterRing = ringContainsPoint(rings[0], longitude, latitude);
  if (!insideOuterRing) {
    return false;
  }

  const insideHole = rings.slice(1).some((ring) => ringContainsPoint(ring, longitude, latitude));
  return !insideHole;
}

function ringContainsPoint(ring, longitude, latitude) {
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];
    const currentLng = Number(currentPoint?.[0]);
    const currentLat = Number(currentPoint?.[1]);
    const previousLng = Number(previousPoint?.[0]);
    const previousLat = Number(previousPoint?.[1]);

    if (![currentLng, currentLat, previousLng, previousLat].every(Number.isFinite)) {
      continue;
    }

    const crossesLatitude = currentLat > latitude !== previousLat > latitude;
    const crossingLongitude =
      ((previousLng - currentLng) * (latitude - currentLat)) / (previousLat - currentLat || Number.EPSILON) +
      currentLng;

    if (crossesLatitude && longitude < crossingLongitude) {
      inside = !inside;
    }
  }

  return inside;
}
