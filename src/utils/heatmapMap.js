import { NAGA_BOUNDS, NAGA_CENTER, isValidCoordinate } from './nagaBoundary';

export function heatZonesToFeatureCollection(zones = [], getColor) {
  return {
    type: 'FeatureCollection',
    features: zones.map((zone, index) => {
      const [longitude, latitude] = getZoneLngLat(zone, index);

      return {
        type: 'Feature',
        id: zone.id,
        properties: {
          id: zone.id,
          label: zone.label || 'Naga City',
          level: zone.level || 'Moderate',
          colorKey: zone.colorKey || 'moderate',
          color: getColor(zone),
          size: Number(zone.size) || 88,
        },
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      };
    }),
  };
}

export function getSelectedZoneLngLat(zones = [], selectedZoneId) {
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) || zones[0];
  return selectedZone ? getZoneLngLat(selectedZone, 0) : [NAGA_CENTER.longitude, NAGA_CENTER.latitude];
}

export function getZoneLngLat(zone, fallbackIndex = 0) {
  const latitude = Number(zone?.latitude ?? zone?.lat);
  const longitude = Number(zone?.longitude ?? zone?.lng);

  if (isValidCoordinate(latitude, longitude)) {
    return [longitude, latitude];
  }

  return percentagePositionToLngLat(zone?.left, zone?.top, fallbackIndex);
}

function percentagePositionToLngLat(left, top, fallbackIndex) {
  const fallbackOffsets = [
    [0.5, 0.5],
    [0.28, 0.32],
    [0.62, 0.24],
    [0.38, 0.64],
    [0.74, 0.54],
    [0.2, 0.72],
  ];
  const [fallbackLeft, fallbackTop] = fallbackOffsets[fallbackIndex % fallbackOffsets.length];
  const x = parsePercent(left, fallbackLeft);
  const y = parsePercent(top, fallbackTop);
  const longitude = NAGA_BOUNDS.minLongitude + x * (NAGA_BOUNDS.maxLongitude - NAGA_BOUNDS.minLongitude);
  const latitude = NAGA_BOUNDS.maxLatitude - y * (NAGA_BOUNDS.maxLatitude - NAGA_BOUNDS.minLatitude);

  return [longitude, latitude];
}

function parsePercent(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const parsed = Number(value.replace('%', '')) / 100;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(0.92, Math.max(0.08, parsed));
}
