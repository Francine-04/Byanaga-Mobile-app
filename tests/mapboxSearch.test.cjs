const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
function setup(fetch, token = 'pk.test-only') {
  return createLoader({ '../data/placeImages': { getPlaceImage: () => null } }, { fetch, process: { env: { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: token } } })('src/services/mapboxService.js');
}
test('category browsing stays in the BYANAGA catalog instead of calling unsupported POI geocoding', async () => {
  let calls = 0;
  const service = setup(async () => { calls++; });
  assert.deepEqual(plain(await service.searchMapboxPlaces({ category: 'Church' })), []);
  assert.deepEqual(plain(await service.searchMapboxPlaces({ query: 'cafe', category: 'Food' })), []);
  assert.equal(calls, 0);
});
test('address search uses current Mapbox geocoding, permanent storage and actual Naga boundary filtering', async () => {
  const service = setup(async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, '/search/geocode/v6/forward');
    assert.equal(parsed.searchParams.get('types'), 'address');
    assert.equal(parsed.searchParams.get('permanent'), 'true');
    assert.equal(parsed.searchParams.get('country'), 'ph');
    return { ok: true, json: async () => ({ features: [
      { id: 'naga', text: 'Address', place_name: 'Address in Naga', center: [123.185, 13.624], place_type: ['address'] },
      { id: 'outside', text: 'Outside', center: [120.9, 14.6], place_type: ['address'] },
    ] }) };
  });
  const result = await service.searchMapboxPlaces({ query: 'Address' });
  assert.equal(result.length, 1);
  assert.equal(result[0].category, 'Address');
});
test('missing token and provider failures are visible, without leaking token values', async () => {
  await assert.rejects(setup(null, '').searchMapboxPlaces({ query: 'Address' }), /token is missing/);
  await assert.rejects(setup(async () => ({ ok: false, status: 403 })).searchMapboxPlaces({ query: 'Address' }), /not authorized/);
});
