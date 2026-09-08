const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
const load = createLoader({ './placeImages': { getPlaceImage: () => null } });
const { generateItinerary } = load('src/utils/generateItinerary.js');
const { matchByPreferences } = load('src/utils/preferenceMatching.js');
const { isCoordinateInsideNagaCity } = load('src/utils/nagaBoundary.js');
const now = new Date('2026-09-08T00:00:00Z');
const place = (id, category = 'Nature', other = {}) => ({ id, name: id, category, latitude: 13.624, longitude: 123.185, ...other });
const pool = [place('park'), place('museum', 'Culture'), place('church', 'Church'), place('cafe', 'Food'), place('mall', 'Shopping'), place('garden')];
const weather = { source: 'open-meteo', updatedAt: now.toISOString(), rainChance: 85, weatherCode: 61, apparentTemperature: 28 };
const run = (options = {}) => generateItinerary({ destinations: pool, now, travelDate: '2026-09-08', ...options });

test('featured recommendations reflect saved category and activity aliases without mutating the catalog', () => {
  assert.equal(matchByPreferences({ places: ['Churches'] }, pool)[0].id, 'church');
  assert.equal(matchByPreferences({ activities: ['Food Trips'] }, pool)[0].id, 'cafe');
  assert.equal(pool[0].id, 'park');
});
test('smart generation reflects preferences, backend IDs and picked duration', () => {
  const result = run({ destinations: pool.map((item) => ({ ...item, dashboardId: `backend-${item.id}` })), preferences: { places: ['Churches'], duration: 'Half Day' } });
  assert.equal(result.days.length, 1);
  assert.equal(result.days[0].places.length, 2);
  assert.equal(result.days[0].places[0].placeId, 'backend-church');
  assert.equal(result.days[0].places[0].visitTime, '08:00');
  assert.equal(result.recommendation.preferences.places[0], 'Churches');
});
test('current rain changes suggestions, but stale readings and future trips do not use today as a forecast', () => {
  const destinations = [place('park'), place('museum', 'Culture')];
  const rainy = run({ destinations, weather });
  assert.equal(rainy.days[0].places[0].title, 'museum');
  assert.equal(rainy.recommendation.weatherUsed, true);
  const future = run({ destinations, weather, travelDate: '2026-09-10' });
  assert.equal(future.days[0].places[0].title, 'park');
  assert.equal(future.recommendation.weatherUsed, false);
  const stale = run({ destinations, weather: { ...weather, updatedAt: '2026-09-01T00:00:00Z' } });
  assert.equal(stale.recommendation.weatherUsed, false);
  assert.equal(stale.days[0].places[0].title, 'park');
});
test('weekend generation uses distinct places and never invents stops for an empty backend', () => {
  const result = run({ preferences: { duration: 'Weekend' } });
  assert.equal(result.days.length, 2);
  const stops = result.days.flatMap((day) => day.places);
  assert.equal(new Set(stops.map((stop) => stop.placeId)).size, stops.length);
  assert.equal(run({ destinations: [] }).days.length, 0);
});
test('unpublished, closed, invalid-coordinate and outside-city places are excluded', () => {
  const destinations = [place('outside', 'Nature', { latitude: 14.6, longitude: 120.9 }), place('invalid', 'Nature', { latitude: null, longitude: null }),
    place('hidden', 'Nature', { isActive: false }), place('pending', 'Food', { status: 'pending' }), place('closed', 'Food', { isOpen: false }), place('good')];
  assert.deepEqual(plain(run({ destinations }).days[0].places.map((p) => p.placeId)), ['good']);
  assert.equal(isCoordinateInsideNagaCity(null, null), false);
  assert.equal(isCoordinateInsideNagaCity(13.624, 123.185), true);
});
test('events use backend dates and times, preserving empty first days for weekend trips', () => {
  const event = { id: 'event1', title: 'Published event', venue: 'City center', startDate: '2026-09-09', endDate: '2026-09-09',
    startTime: '14:00', endTime: '17:00', locationLat: 13.624, locationLng: 123.185, status: 'upcoming' };
  const result = run({ destinations: [], events: [event], preferences: { duration: 'Weekend' } });
  assert.equal(result.days[0].places.length, 0);
  assert.equal(result.days[1].places[0].eventId, 'event1');
  assert.equal(result.days[1].places[0].visitTime, '14:00');
  assert.equal(run({ destinations: [], events: [event] }).days.length, 0);
});
test('published operating hours determine the scheduled visit', () => {
  const result = run({ destinations: [place('restaurant', 'Food', { operatingHours: [{ day: 'Tuesday', isOpen: true, openTime: '11:30', closeTime: '18:00' }] })] });
  assert.equal(result.days[0].places[0].visitTime, '11:30');
});
