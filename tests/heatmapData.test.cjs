const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');
const load = createLoader({ './placeImages': { getPlaceImage: () => null } });
const { deriveHeatZones, zonesToMarkers } = load('src/utils/heatmapData.js');
const place = (id, visitCount) => ({ id, name: id, latitude: 13.624, longitude: 123.185, visitCount });
test('all valid locations appear; missing activity is unknown, not low', () => {
  const destinations = Array.from({ length: 12 }, (_, i) => place(`Place ${i}`, 0));
  destinations.push({ ...place('Outside'), latitude: 10 });
  const zones = deriveHeatZones({ destinations });
  assert.equal(zones.length, 12);
  assert.ok(zones.every((zone) => zone.level === 'Unknown' && zone.count === null));
  assert.equal(zonesToMarkers(zones).length, 12);
});
test('recorded counts produce four relative activity levels', () => {
  const zones = deriveHeatZones({ destinations: [place('a', 10), place('b', 35), place('c', 60), place('d', 100)] });
  assert.equal(zones.find((z) => z.destination.id === 'a').level, 'Low');
  assert.equal(zones.find((z) => z.destination.id === 'b').level, 'Moderate');
  assert.equal(zones.find((z) => z.destination.id === 'c').level, 'Busy');
  assert.equal(zones.find((z) => z.destination.id === 'd').level, 'Crowded');
});
test('expected attendance is not treated as recorded crowd activity', () => {
  assert.equal(deriveHeatZones({ events: [{ id: 'e', expectedAttendance: 100, locationLat: 13.624, locationLng: 123.185 }] }).length, 0);
});
