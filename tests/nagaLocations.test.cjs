const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
const load = createLoader({ 'ph-locations': require('ph-locations') });
const { normalizeHomeLocation } = load('src/data/philippineLocations.js');

test('Naga resolves under Camarines Sur and incompatible selections are cleared', () => {
  assert.equal(normalizeHomeLocation({ regionCode: 'PH-05', provinceCode: 'PH-CAS', city: 'Naga City' }).city, 'Naga City');
  assert.deepEqual(plain(normalizeHomeLocation({ regionCode: 'PH-05', provinceCode: 'PH-CEB', city: 'Naga City' })), { regionCode: 'PH-05', provinceCode: '', city: '' });
});
