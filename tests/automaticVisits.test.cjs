const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
const { createVisitDetector, activityZones, activityLevel, dateDayKey, registeredPlaces, TOURISM_CATEGORIES } = createLoader()('src/utils/automaticVisits.js');
const p = { id: 'p', latitude: 13.6261, longitude: 123.1851, radius: 70, category: 'Church', name: 'Cathedral' };
const reading = (t, overrides = {}) => ({ timestamp: t, coords: { latitude: p.latitude, longitude: p.longitude, accuracy: 8, speed: 0, ...overrides } });
const feed = (detector, times, state = {}, overrides = {}) => times.flatMap((t) => detector.sample(reading(t, overrides), state, t));
test('arrival requires three accurate readings over ten seconds, not a two-hour stay', () => {
  const detector = createVisitDetector([p]);
  assert.deepEqual(plain(feed(detector, [100000, 105000, 110000])), [{ placeId: 'p', phase: 'inside' }]);
  assert.equal(feed(detector, [115000, 120000, 125000], { p: { phase: 'inside', sequence: 1 } }).length, 0);
});
test('confirmed departure and return produce one subsequent visit; restarting inside does not', () => {
  const detector = createVisitDetector([p]);
  const states = { p: { phase: 'inside', sequence: 1 } };
  assert.equal(feed(detector, [100000, 105000, 110000], states).length, 0);
  assert.deepEqual(plain(feed(detector, [150000, 155000, 160000], states, { longitude: p.longitude + 0.003 })), [{ placeId: 'p', phase: 'outside' }]);
  states.p.phase = 'outside';
  assert.deepEqual(plain(feed(detector, [200000, 205000, 210000], states)), [{ placeId: 'p', phase: 'inside' }]);
});
test('bad accuracy, stale, mocked, fast and impossible coordinates do not create visits', () => {
  for (const overrides of [{ accuracy: 100 }, { speed: 20 }, { mocked: true }, { latitude: 200 }, { longitude: Infinity }]) {
    assert.equal(feed(createVisitDetector([p]), [100000, 105000, 110000], {}, overrides).length, 0);
  }
  const detector = createVisitDetector([p]);
  assert.equal(detector.sample(reading(100000), {}, 130000).length, 0);
  assert.equal(detector.sample(reading(140000), {}, 130000).length, 0);
});
test('out-of-order or repeated fixes, long gaps and jitter cannot confirm arrival', () => {
  const detector = createVisitDetector([p]);
  assert.equal(feed(detector, [100000, 100000, 100000, 99999]).length, 0);
  assert.equal(feed(detector, [150000, 155000]).length, 0);
  detector.sample(reading(160000, { accuracy: 100 }), {}, 160000);
  assert.equal(feed(detector, [165000, 170000]).length, 0);
});
test('overlapping geofences and uncertainty near an edge are not credited', () => {
  assert.equal(feed(createVisitDetector([p, { ...p, id: 'q' }]), [100000, 105000, 110000]).length, 0);
  assert.equal(feed(createVisitDetector([p]), [100000, 105000, 110000], {}, { longitude: p.longitude + 0.0006, accuracy: 25 }).length, 0);
});
test('registered catalog covers seven categories and rejects disabled or invalid coordinates', () => {
  const configs = Object.fromEntries(TOURISM_CATEGORIES.map((category) => [category, { ...p, category, enabled: true, automaticEnabled: true }]));
  configs.bad = { ...p, latitude: 0, longitude: 0, enabled: true, automaticEnabled: true };
  configs.disabled = { ...p, enabled: true, automaticEnabled: false };
  assert.equal(registeredPlaces(configs).length, 7);
});
test('activity uses configurable absolute visit counts, including zero, with category and level filters', () => {
  const thresholds = { moderate: 5, busy: 15, crowded: 30 };
  assert.deepEqual([0, 4, 5, 14, 15, 29, 30].map((n) => activityLevel(n, thresholds)), ['Low', 'Low', 'Moderate', 'Moderate', 'Busy', 'Busy', 'Crowded']);
  assert.equal(activityLevel(100, null), null);
  assert.equal(activityZones([p], { 20745: { p: 4 }, 20746: { p: 12 } }, thresholds, 'Church', 'Busy')[0].count, 16);
  assert.equal(activityZones([p], { 20745: { p: 4 } }, thresholds, 'Food').length, 0);
  assert.equal(activityZones([p], {}, thresholds)[0].count, 0);
  assert.equal(dateDayKey('2026-02-30'), null);
  assert.equal(dateDayKey('2026-10-25'), '20751');
});
test('web location access does not prompt automatically and clears its watcher', async () => {
  let state = 'prompt', prompts = 0, cleared = 0;
  const navigator = { permissions: { query: async () => ({ state }) }, geolocation: {
    getCurrentPosition: (ok) => { prompts++; state = 'granted'; ok({}); },
    watchPosition: () => 9, clearWatch: (id) => { cleared = id; },
  } };
  const access = createLoader({}, { navigator, isSecureContext: true, setInterval, clearInterval })('src/services/locationAccess.web.js');
  assert.equal(await access.locationAccessStatus(), 'prompt');
  await assert.rejects(access.watchLocation(() => {}, () => {}));
  assert.equal(prompts, 0);
  assert.equal(await access.requestLocationAccess(), 'granted');
  const stop = await access.watchLocation(() => {}, () => {}); stop();
  assert.equal(cleared, 9);
  state = 'denied';
  assert.equal(await access.locationAccessStatus(), 'denied');
});
