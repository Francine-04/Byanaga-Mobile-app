const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('./helpers/load.cjs');
const manifest = fs.readFileSync(path.join(__dirname, '../src/data/suppliedPlacePhotos.js'), 'utf8');
const assets = [...manifest.matchAll(/require\('([^']+)'\)/g)].map((match) => match[1]);
const load = createLoader(Object.fromEntries(assets.map((asset) => [asset, { uri: asset }])));
const { suppliedPlacePhotos } = load('src/data/suppliedPlacePhotos.js');
const { withSuppliedPlaceImages, getSuppliedPlacePhotos, suppliedFoodPhotos } = load('src/utils/suppliedPlaceImages.js');

test('all 235 supplied images are registered with existing, mobile-compatible assets', () => {
  assert.equal(suppliedPlacePhotos.length, 235);
  assert.equal(new Set(assets).size, 235);
  assert.equal(new Set(suppliedPlacePhotos.map((photo) => photo.sourceFile)).size, 235);
  for (const asset of assets) {
    assert.match(asset, /\.(jpg|png|webp)$/);
    assert.ok(fs.statSync(path.resolve(__dirname, '../src/data', asset)).size > 0, asset);
  }
});

test('church initials and alternate catalog names match the intended church', () => {
  assert.ok(getSuppliedPlacePhotos({ name: 'Metropolitan Cathedral of St. John the Evangelist' }).some((photo) => photo.sourceFile === 'Church/MCoStJTE.jpg'));
  assert.ok(getSuppliedPlacePhotos({ name: 'Holy Cross Parish (Brgy. Mabolo Chapel)' }).some((photo) => photo.sourceFile === 'Church/HCP BRGY.MC.png'));
  assert.ok(getSuppliedPlacePhotos({ name: 'Peñafrancia Basilica Minore' }).some((photo) => photo.sourceFile === 'Church/MBaNSoOoP.jpg'));
  assert.equal(getSuppliedPlacePhotos({ name: 'An unknown church', category: 'Church' }).length, 0);
});

test('duplicate photos are kept in galleries, not lost, and repeat decoration is safe', () => {
  const original = { id: 'cbd', name: 'CBD Plaza Hotel', latitude: 13.62, photos: [{ id: 'remote', image: 'https://example.com/photo.jpg' }] };
  const decorated = withSuppliedPlaceImages(original);
  assert.equal(decorated.photos.length, 3);
  assert.equal(withSuppliedPlaceImages(decorated).photos.length, 3);
  assert.equal(decorated.gallery.length, 2);
  assert.equal(withSuppliedPlaceImages(decorated).gallery.length, 2);
  assert.equal(original.photos.length, 1);
  assert.equal(decorated.id, original.id);
  assert.equal(decorated.latitude, original.latitude);
});

test('matching is accent and punctuation tolerant but never fuzzy across venues or branches', () => {
  assert.ok(getSuppliedPlacePhotos({ name: 'Our Lady of Penafrancia Museum' }).length >= 2);
  assert.equal(getSuppliedPlacePhotos({ name: 'Bigg’s Diner Magsaysay' }).length, 1);
  assert.ok(getSuppliedPlacePhotos({ name: 'SM City Naga' }).length);
  assert.equal(getSuppliedPlacePhotos({ name: 'SM Supermarket' }).length, 1);
  assert.notEqual(getSuppliedPlacePhotos({ name: 'SM Supermarket' })[0].id, getSuppliedPlacePhotos({ name: 'SM City Naga' })[0].id);
  assert.equal(getSuppliedPlacePhotos({ name: 'Avenue Plaza' })[0].category, 'Shopping');
  assert.equal(getSuppliedPlacePhotos({ name: 'Avenue Plaza Hotel' })[0].category, 'Accommodation');
});

test('dish photos and unresolved initials are never used as venue cover photos', () => {
  assert.equal(suppliedFoodPhotos.length, 33);
  assert.equal(getSuppliedPlacePhotos({ name: 'kinalas', category: 'Food' }).length, 0);
  for (const photo of suppliedPlacePhotos.filter((photo) => photo.pending)) {
    assert.equal(getSuppliedPlacePhotos({ name: photo.name }).length, 0);
  }
  const original = { name: 'Unmatched location', image: 'https://example.com/existing.jpg' };
  assert.equal(withSuppliedPlaceImages(original), original);
});

test('second import matches new names, filename counters and spelling aliases', () => {
  assert.ok(getSuppliedPlacePhotos({ name: 'Fiesta Hotel' }).length);
  assert.ok(getSuppliedPlacePhotos({ name: 'Alnur Dico\'s Residence' }).length);
  assert.equal(getSuppliedPlacePhotos({ name: 'SouthPoolSide Tourist Inn' }).length, 3);
  assert.equal(getSuppliedPlacePhotos({ name: 'Unknown Soldier Monument' }).length, 2);
  assert.ok(getSuppliedPlacePhotos({ name: 'Sampaguita Department Store' }).length);
  assert.equal(getSuppliedPlacePhotos({ name: 'Sunny View' }).length, 0);
  assert.equal(getSuppliedPlacePhotos({ name: 'Tabuco Travel Lodge' }).length, 0);
});
