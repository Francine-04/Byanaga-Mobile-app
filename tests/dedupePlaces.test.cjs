const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');
const { dedupePlaces } = createLoader()('src/utils/dedupePlaces.js');
test('duplicate API and business entries collapse while business navigation is retained', () => {
  const first = { id: 'business-1', establishmentId: '1', name: "Bigg’s Diner", latitude: 13.62, longitude: 123.18 };
  assert.equal(dedupePlaces([first, { id: 'api', name: "Biggs Diner", latitude: 13.62001, longitude: 123.18 }]).length, 1);
  assert.equal(dedupePlaces([first, { id: 'other', dashboardId: '1', name: 'Other display name' }])[0].id, first.id);
});

test('known nearby alternate names collapse and preserve photos and category filters', () => {
  for (const [a, b] of [['Quince Martires', 'Plaza Quince Martires'], ['E-Mall', 'Robinsons E-Mall'], ['LCC Mall', 'LCC Mall Naga']]) {
    const result = dedupePlaces([{ id: 'first', name: a, latitude: '13.62', longitude: '123.18', category: 'Culture' }, { id: 'second', name: b, latitude: 13.6201, longitude: 123.18, image: 'photo.jpg', category: 'Historical' }]);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'first');
    assert.equal(result[0].image, 'photo.jpg');
    assert.ok(result[0].tags.includes('Historical'));
  }
});
test('city-only fallback address does not keep a redundant catalog entry', () => {
  assert.equal(dedupePlaces([{ name: 'Black Scoop Cafe', address: 'Naga City, Camarines Sur' }, { name: 'BlackScoop Cafe', address: 'Magsaysay Avenue, Naga City' }]).length, 1);
});
test('distinct branches and distinct street addresses are preserved', () => {
  assert.equal(dedupePlaces([{ name: 'Jollibee', latitude: 13.62, longitude: 123.18 }, { name: 'Jollibee', latitude: 13.64, longitude: 123.18 }]).length, 2);
  assert.equal(dedupePlaces([{ name: 'Hotel', address: 'Street A' }, { name: 'Hotel', address: 'Street B' }]).length, 2);
  assert.equal(dedupePlaces([{ name: 'SM City Naga' }, { name: 'SM Supermarket' }]).length, 2);
});
test('known cathedral aliases collapse without changing original objects', () => {
  const first = { id: '1', name: 'Naga Metropolitan Cathedral' };
  assert.equal(dedupePlaces([first, { id: '2', name: 'Metropolitan Cathedral of St. John the Evangelist' }]).length, 1);
  assert.equal(first.name, 'Naga Metropolitan Cathedral');
});
