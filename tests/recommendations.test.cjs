const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
const load = createLoader({ './placeImages': { getPlaceImage: () => null } });
const { generateItinerary } = load('src/utils/generateItinerary.js');
const { matchByPreferences } = load('src/utils/preferenceMatching.js');
const { recommendationDetails } = load('src/utils/preferenceMatching.js');
const { personalizedRecommendations } = load('src/utils/preferenceMatching.js');
const { tripDayCount } = load('src/utils/tripDuration.js');

test('day and week durations create consecutive days without repeating stops', () => {
  assert.equal(tripDayCount('3 Days'), 3);
  assert.equal(tripDayCount('2 Weeks'), 14);
  assert.equal(tripDayCount('Weekend'), 2);
  for (const value of ['0 Days', '31 Days', '5 Weeks', 'bad']) assert.throws(() => tripDayCount(value));
  const catalog = Array.from({ length: 60 }, (_, i) => ({ id: `p${i}`, name: `Place ${i}`, category: 'Nature', latitude: 13.624, longitude: 123.185 }));
  const result = generateItinerary({ destinations: catalog, preferences: { duration: '2 Weeks' }, travelDate: '2026-10-19', now: new Date('2026-10-19T00:00:00Z') });
  assert.equal(result.days.length, 14);
  assert.equal(result.days[13].date, '2026-11-01');
  const stops = result.days.flatMap((day) => day.places);
  assert.equal(stops.length, 56);
  assert.equal(new Set(stops.map((stop) => stop.placeId)).size, 56);
  const sparse = generateItinerary({ destinations: catalog.slice(0, 1), preferences: { duration: '1 Week' }, travelDate: '2026-10-19' });
  assert.equal(sparse.days.length, 7);
  assert.match(sparse.advice, /Some days have no suggested stops/);
});

test('visible recommendations include newly added interests and remove deselected ones', () => {
  const catalog = [{ id: 'c1', category: 'Church' }, { id: 'c2', category: 'Church' }, { id: 'c3', category: 'Church' }, { id: 'f1', category: 'Food' }, { id: 's1', category: 'Shopping' }];
  const before = personalizedRecommendations({ places: ['Churches'] }, catalog);
  assert.deepEqual(plain(before.map((p) => p.id)), ['c1', 'c2', 'c3']);
  const added = personalizedRecommendations({ places: ['Churches', 'Food'] }, catalog);
  assert.equal(added[0].id, 'f1');
  const replaced = personalizedRecommendations({ places: ['Shopping'] }, catalog);
  assert.deepEqual(plain(replaced.map((p) => p.id)), ['s1']);
  assert.equal(personalizedRecommendations({ places: ['Nature'] }, catalog).length, 0);
});

test('recommendation descriptions explain actual matches and avoid claiming unmatched interests', () => {
  const preferences = { places: ['Museums', 'Food'], travelStyle: 'Family', budget: 'Budget' };
  const detail = recommendationDetails(preferences, { category: 'Culture', travelStyle: 'Family', budget: 'Budget' });
  assert.match(detail.description, /museums/);
  assert.match(detail.description, /family/);
  assert.match(detail.description, /budget/);
  assert.doesNotMatch(detail.description, /food/);
  assert.deepEqual(plain(detail.tags), ['Museums', 'Family']);
  const unrelated = recommendationDetails(preferences, { category: 'Nature' });
  assert.match(unrelated.description, /additional nature stop/);
  assert.deepEqual(plain(unrelated.tags), []);
});

test('recommendations include published destination descriptions without inventing missing details', () => {
  const detail = recommendationDetails({ places: ['Culture'] }, { name: 'Museum', category: 'Culture', description: 'A collection of local art.' });
  assert.match(detail.description, /A collection of local art\./);
  assert.match(detail.description, /Recommended because you enjoy culture/);
  const fallback = recommendationDetails({}, { name: 'Abella', category: 'Culture', description: 'Tourism destination from the dashboard.' });
  assert.match(fallback.description, /Abella is listed as a culture destination in Naga City/);
  assert.doesNotMatch(fallback.description, /from the dashboard|because you enjoy/);
});
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
test('editing saved interests reorders recommendations despite weather and popularity', () => {
  const catalog = [place('popular-mall', 'Shopping', { visitCount: 9999 }), place('park'), place('cafe', 'Food'), place('church', 'Church')];
  for (const [interest, expected] of [['Nature', 'park'], ['Food', 'cafe'], ['Churches', 'church'], ['Shopping', 'popular-mall']]) {
    assert.equal(matchByPreferences({ places: [interest], activities: ['Food Trips'] }, catalog, weather, now)[0].id, expected);
  }
  assert.equal(catalog[0].id, 'popular-mall');
});
test('historical and museum edits prioritize specific tags over broad Culture aliases', () => {
  const catalog = [place('gallery', 'Culture', { visitCount: 999 }), place('memorial', 'Historical', { tags: ['Culture', 'Historical'] }), place('museum', 'Culture', { tags: ['Museum'] })];
  assert.equal(matchByPreferences({ places: ['Historical'] }, catalog)[0].id, 'memorial');
  assert.equal(matchByPreferences({ places: ['Museums'] }, catalog)[0].id, 'museum');
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
test('generated stops explain preference matches and applicable weather', () => {
  const result = run({ destinations: [place('cafe', 'Food', { description: 'A local dining stop.' })], preferences: { places: ['Food'] }, weather });
  const reason = result.days[0].places[0].recommendationReason;
  assert.match(reason, /A local dining stop/);
  assert.match(reason, /because you enjoy food/);
  assert.match(reason, /Rain is possible/);
  assert.match(result.advice, /Why visit these places/);
  assert.match(result.advice, /interests in food/);
  assert.match(result.advice, /Rain is possible/);
  assert.equal(result.recommendation.summary, result.advice);
  const future = run({ preferences: { places: ['Nature'] }, weather, travelDate: '2026-09-10' });
  assert.match(future.days[0].places[0].recommendationReason, /current weather was not used/);
  assert.doesNotMatch(future.days[0].places[0].recommendationReason, /Rain is possible/);
});
test('regenerating uses changed preferences and weather to choose stops', () => {
  const catalog = [place('park1'), place('park2'), place('cafe1', 'Food'), place('cafe2', 'Food')];
  const nature = run({ destinations: catalog, preferences: { places: ['Nature'], duration: 'Half Day' } });
  const food = run({ destinations: catalog, preferences: { places: ['Food'], duration: 'Half Day' } });
  assert.ok(nature.days[0].places.every((stop) => stop.category === 'Nature'));
  assert.ok(food.days[0].places.every((stop) => stop.category === 'Food'));
  const rainy = run({ destinations: catalog, preferences: { duration: 'Half Day' }, weather });
  assert.ok(rainy.days[0].places.every((stop) => stop.category === 'Food'));
});
