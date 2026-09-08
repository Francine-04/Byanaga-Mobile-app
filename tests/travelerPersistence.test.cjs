const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
function setup(user = { uid: 'traveler-1' }) {
  let listener;
  let errorListener;
  let disconnected = false;
  const writes = [];
  let bookmarks = ['church'];
  const service = createLoader({ 'react-native': { Platform: { OS: 'web' } }, 'firebase/auth': { updateProfile: async () => {} },
    './firebaseApp': { auth: { currentUser: user }, realtimeDb: {} },
    'firebase/database': {
      ref: (_, path) => path, serverTimestamp: () => 1234,
      update: async (path, data) => writes.push([path, plain(data)]),
      onValue: (path, next, error) => { assert.equal(path, 'users/traveler-1'); listener = next; errorListener = error; return () => { disconnected = true; }; },
      runTransaction: async (path, transform) => { assert.equal(path, 'users/traveler-1/bookmarks'); bookmarks = transform(bookmarks); },
    },
  })('src/services/authService.js');
  return { service, writes, publish: (value) => listener({ val: () => value }), deny: () => errorListener(new Error('Permission denied')),
    get disconnected() { return disconnected; }, get bookmarks() { return plain(bookmarks); } };
}
test('saved preferences and profile changes write only to the current UID, including greeting and photos', async () => {
  const { service, writes } = setup();
  await service.saveTravelerPreferences('traveler-1', { places: ['Food', 'Food'], activities: ['Food Trips'], budget: 'Moderate', duration: 'One Day' });
  assert.equal(writes[0][0], 'users/traveler-1');
  assert.deepEqual(writes[0][1].preferences.places, ['Food']);
  await service.saveTravelerProfile('traveler-1', { name: 'Ana Santos', firstName: 'Old', image: 'https://example.com/avatar.png', coverImage: 'https://example.com/cover.jpg' });
  assert.equal(writes[1][1].firstName, 'Ana');
  assert.equal(writes[1][1].lastName, 'Santos');
  assert.equal(writes[1][1].coverImage, 'https://example.com/cover.jpg');
  assert.equal(Object.hasOwn(writes[1][1], 'password'), false);
});
test('profile subscription receives backend edits, reports denied reads and detaches cleanly', () => {
  const harness = setup();
  const snapshots = [];
  const errors = [];
  const stop = harness.service.subscribeToTravelerRecord('traveler-1', (record) => snapshots.push(harness.service.travelerRecordToAppState(record)), (error) => errors.push(error.message));
  harness.publish({ name: 'Ana Santos', preferences: { places: ['Nature'] }, image: 'avatar' });
  harness.publish({ name: 'Ana Santos', preferences: { places: ['Churches'] }, image: 'new-avatar' });
  assert.equal(snapshots[1].preferences.places[0], 'Churches');
  assert.equal(snapshots[1].profile.image, 'new-avatar');
  harness.deny();
  assert.equal(errors[0], 'Permission denied');
  stop();
  assert.equal(harness.disconnected, true);
});
test('bookmarks use an authenticated transaction and toggle without duplicates', async () => {
  const harness = setup();
  await harness.service.toggleTravelerBookmark('traveler-1', 'museum');
  assert.deepEqual(harness.bookmarks, ['church', 'museum']);
  await harness.service.toggleTravelerBookmark('traveler-1', 'church');
  assert.deepEqual(harness.bookmarks, ['museum']);
});
test('guest, signed-out and mismatched sessions cannot write profile, preferences or bookmarks', async () => {
  for (const user of [null, { uid: 'traveler-1', isAnonymous: true }, { uid: 'another-user' }]) {
    const { service, writes } = setup(user);
    await assert.rejects(service.saveTravelerProfile('traveler-1', { name: 'Test' }));
    await assert.rejects(service.saveTravelerPreferences('traveler-1', { places: ['Food'] }));
    await assert.rejects(service.toggleTravelerBookmark('traveler-1', 'museum'));
    assert.equal(writes.length, 0);
  }
});
test('legacy null preferences restore to an unselected form', () => {
  const { service } = setup();
  assert.deepEqual(plain(service.travelerRecordToAppState({ preferences: null }).preferences), { places: [], activities: [], travelStyle: '', budget: '', duration: '' });
});
