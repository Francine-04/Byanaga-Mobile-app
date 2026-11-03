const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');
const mocks = { '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => {} } };
const { normalizeGeoapifyPlace } = createLoader(mocks)('src/services/geoapifyPlacesService.js');
const feature = (category, lat = 13.624) => ({ properties: { name: 'Test', place_id: 'test', lat, lon: 123.185, categories: [category] } });
test('Geoapify places are restricted to Naga and categorized without invented ratings', () => {
  for (const [input, expected] of [['accommodation.hotel', 'Accommodation'], ['catering.restaurant', 'Food'], ['leisure.park', 'Nature'], ['religion.place_of_worship', 'Church']]) {
    const place = normalizeGeoapifyPlace(feature(input));
    assert.equal(place.category, expected);
    assert.equal(place.rating, null);
  }
  assert.equal(normalizeGeoapifyPlace(feature('catering', 10.3)), null);
});
test('Geoapify request uses Naga bounds and failure does not expose credentials', async () => {
  const load = createLoader(mocks, { process: { env: { EXPO_PUBLIC_GEOAPIFY_API_KEY: 'test-secret' } }, fetch: async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.hostname, 'api.geoapify.com');
    assert.match(parsed.searchParams.get('filter'), /^rect:123\.173/);
    return { ok: false };
  } });
  await assert.rejects(load('src/services/geoapifyPlacesService.js').fetchGeoapifyPlaces(), /^Error: Geoapify places are temporarily unavailable\.$/);
});
test('malls are shopping places even with other categories', () => {
  const mall = feature('commercial.shopping_mall');
  mall.properties.categories.push('catering.restaurant');
  const place = normalizeGeoapifyPlace(mall);
  assert.equal(place.category, 'Shopping');
  assert.ok(place.tags.includes('Mall'));
  assert.match(place.description, /shopping mall/);
});
test('dedicated shopping query adds malls and deduplicates place IDs', async () => {
  const requests = [];
  const load = createLoader(mocks, { process: { env: { EXPO_PUBLIC_GEOAPIFY_API_KEY: 'test-secret' } }, fetch: async (url) => {
    requests.push(new URL(url).searchParams.get('categories'));
    return { ok: true, json: async () => ({ features: [feature('commercial.shopping_mall')] }) };
  } });
  const places = await load('src/services/geoapifyPlacesService.js').fetchGeoapifyPlaces();
  assert.equal(requests.length, 6);
  assert.ok(requests[4].includes('religion.place_of_worship'));
  assert.ok(requests[5].includes('activity.events_venue'));
  assert.ok(requests[3].includes('catering.restaurant'));
  assert.ok(requests[1].includes('commercial.shopping_mall'));
  assert.ok(requests[2].includes('entertainment.museum'));
  assert.ok(requests[2].includes('tourism.sights'));
  assert.equal(places.length, 1);
});
test('churches include tourism worship categories and event venues are not scheduled events', () => {
  for (const input of ['religion.place_of_worship.christianity', 'tourism.sights.place_of_worship.cathedral', 'tourism.sights.place_of_worship.chapel']) {
    const place = normalizeGeoapifyPlace(feature(input));
    assert.equal(place.category, 'Church');
    assert.match(place.description, /Confirm service times/);
    assert.equal(normalizeGeoapifyPlace(feature(input, 10.3)), null);
  }
  for (const input of ['activity.events_venue', 'tourism.sights.conference_centre']) {
    const place = normalizeGeoapifyPlace(feature(input));
    assert.equal(place.category, 'Event Venues');
    assert.match(place.description, /not a scheduled event/);
    assert.equal(place.startDate, undefined);
    assert.equal(normalizeGeoapifyPlace(feature(input, 10.3)), null);
  }
});
test('cultural venues are Culture, not generic Entertainment; cinemas remain Entertainment', () => {
  for (const category of ['entertainment.museum', 'entertainment.culture.gallery', 'entertainment.culture.theatre', 'tourism.attraction.artwork']) {
    const place = normalizeGeoapifyPlace(feature(category));
    assert.equal(place.category, 'Culture');
    assert.ok(place.tags.length > 1);
    assert.match(place.description, /cultural site/);
    assert.equal(normalizeGeoapifyPlace(feature(category, 10.3)), null);
  }
  assert.equal(normalizeGeoapifyPlace(feature('entertainment.cinema')).category, 'Entertainment');
});
test('historical landmarks keep Culture tags and dining places stay Food', () => {
  for (const input of ['building.historic', 'tourism.sights.memorial.monument', 'tourism.sights.archaeological_site']) {
    const place = normalizeGeoapifyPlace(feature(input));
    assert.equal(place.category, 'Historical');
    assert.ok(place.tags.includes('Culture'));
  }
  for (const input of ['catering.restaurant', 'catering.cafe', 'catering.fast_food', 'catering.food_court', 'catering.ice_cream']) {
    const place = normalizeGeoapifyPlace(feature(input));
    assert.equal(place.category, 'Food');
    assert.ok(place.typeLabel);
    assert.equal(normalizeGeoapifyPlace(feature(input, 10.3)), null);
  }
});
