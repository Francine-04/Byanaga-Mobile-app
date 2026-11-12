const { test } = require('node:test');
const assert = require('node:assert/strict');
const { aggregateCrowd, recordVisit, TTL } = require('../functions/crowd');
const { createLoader } = require('./helpers/load.cjs');
const { liveCrowdZones } = createLoader()('src/utils/liveCrowd.js');
test('one tourist can visit multiple places; renewal, checkout and expiry are independent', () => {
  const state = { places: { p: { enabled: true, capacity: 10 }, q: { enabled: true, capacity: 10 } },
    checkins: { u: { p: { placeId: 'p', updatedAt: 1000 }, q: { placeId: 'q', updatedAt: 2000 } }, v: { p: { placeId: 'p', updatedAt: 1000 } } } };
  aggregateCrowd(state, 2000);
  assert.equal(state.public.places.p.count, 2);
  assert.equal(state.public.places.q.count, 1);
  state.checkins.u.p.updatedAt = 3000;
  aggregateCrowd(state, 3000);
  assert.equal(state.public.places.p.count, 2);
  delete state.checkins.u.p;
  aggregateCrowd(state, 3000);
  assert.equal(state.public.places.p.count, 1);
  assert.equal(state.public.places.q.count, 1);
  aggregateCrowd(state, 1000 + TTL);
  assert.equal(state.public.places.p.count, 0);
  assert.equal(state.public.places.q.count, 1);
  assert.equal(state.public.places.p.historicalVisits, 2);
});
test('occupancy boundaries match requested four colors; capacity is required', () => {
  for (const [count, level] of [[0, 'low'], [24, 'low'], [25, 'moderate'], [49, 'moderate'], [50, 'busy'], [74, 'busy'], [75, 'crowded'], [110, 'crowded']]) {
    const checkins = Object.fromEntries(Array.from({ length: count }, (_, i) => [`u${i}`, { placeId: 'p', updatedAt: 1000 }]));
    const result = aggregateCrowd({ places: { p: { enabled: true, capacity: 100 }, q: { enabled: true } }, checkins }, 1000);
    assert.equal(result.public.places.p.level, level);
    assert.equal(result.public.places.q.level, null);
    assert.equal(result.public.checkins, undefined);
  }
});
test('check-ins last 48 hours; renewal counts once and checkout removes count', () => {
  assert.equal(TTL, 48 * 60 * 60 * 1000);
  let state = { places: { p: { enabled: true, capacity: 10 } }, checkins: { u: { placeId: 'p', updatedAt: 1000 } } };
  assert.equal(aggregateCrowd(state, 1000 + 24 * 60 * 60 * 1000).public.places.p.count, 1);
  assert.equal(aggregateCrowd(state, 1000 + TTL - 1).public.places.p.count, 1);
  state.checkins.u.updatedAt = 2000;
  assert.equal(aggregateCrowd(state, 2000).public.places.p.count, 1);
  assert.equal(aggregateCrowd(state, 2000 + TTL).public.places.p.count, 0);
  assert.equal(state.checkins.u, undefined);
  state.checkins.u = { placeId: 'p', updatedAt: 3000 };
  delete state.checkins.u;
  assert.equal(aggregateCrowd(state, 3000).public.places.p.count, 0);
});
test('heatmap hides stale or unconfigured levels instead of inventing Unknown/Low', () => {
  const destinations = [{ id: 'p', name: 'Place', latitude: 13.624, longitude: 123.185 }];
  const snapshot = { updatedAt: 1000, places: { p: { count: 2, capacity: 4, level: 'busy' } } };
  assert.equal(liveCrowdZones(destinations, snapshot, 1000)[0].level, 'Busy');
  assert.equal(liveCrowdZones(destinations, snapshot, 122000).length, 0);
  snapshot.places.p.level = null;
  assert.equal(liveCrowdZones(destinations, snapshot, 1000).length, 0);
});
test('visit history survives expiry and checkout; same-day renewals are deduplicated', () => {
  const state = { places: { p: { enabled: true, capacity: 10 } }, checkins: { u: { placeId: 'p', updatedAt: 1000 } } };
  aggregateCrowd(state, 1000);
  recordVisit(state, 'u', { placeId: 'p', updatedAt: 2000 });
  aggregateCrowd(state, 1000 + TTL);
  assert.equal(state.public.places.p.count, 0);
  assert.equal(state.public.places.p.historicalVisits, 1);
  assert.ok(state.history.u);
  recordVisit(state, 'v', { placeId: 'p', updatedAt: 1000 });
  aggregateCrowd(state, 1000 + TTL);
  assert.equal(state.public.places.p.historicalVisits, 2);
  assert.equal(state.public.history, undefined);
});
