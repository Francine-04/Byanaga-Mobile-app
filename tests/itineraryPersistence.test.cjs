const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
function setup(initial = {}, user = { uid: 'user-1' }) {
  const records = structuredClone(initial);
  const writes = [];
  const db = {
    ref: (_, location) => ({ location, key: location.split('/').at(-1) }),
    query: (reference, ...filters) => ({ ...reference, filters }), orderByChild: (key) => key, equalTo: (value) => value,
    serverTimestamp: () => 123456, push: (reference) => ({ location: `${reference.location}/generated-id`, key: 'generated-id' }),
    get: async (reference) => {
      if (!reference.filters && !records[reference.key]) throw new Error('Permission denied reading a nonexistent itinerary');
      return { val: () => records[reference.key] || null, forEach: (callback) => Object.entries(records).filter(([, data]) => data.userId === reference.filters?.[1]).forEach(([key, data]) => callback({ key, val: () => data })) };
    },
    set: async (reference, data) => { writes.push(reference.location); records[reference.key] = plain(data); },
    update: async (reference, data) => { writes.push(reference.location); records[reference.key] = { ...records[reference.key], ...plain(data) }; },
    remove: async (reference) => { writes.push(reference.location); delete records[reference.key]; },
  };
  const service = createLoader({ 'firebase/database': db, './firebaseApp': { realtimeDb: {} }, '../data/placeImages': { getPlaceImage: () => null },
    './authService': { ensureAuthenticatedUser: async () => { if (!user || user.isAnonymous) throw new Error('Login required'); return user; } } })('src/services/itineraryService.js');
  return { service, records, writes };
}
const stop = (id, visitTime = '08:00') => ({ entryId: id, placeId: `backend-${id}`, placeName: id, latitude: 13.624, longitude: 123.185, visitTime });
const draft = { tripName: 'My trip', travelDate: '2026-09-08', status: 'Upcoming', days: [{ places: [stop('z-first'), stop('a-second', '2:00 PM')] }, { places: [] }] };
test('save, reload, edit, delete retain one itinerary, backend IDs, order, empty days and picker values', async () => {
  const { service, records } = setup();
  const { id } = await service.saveItineraryToDatabase(draft);
  const originalCreatedAt = records[id].createdAt;
  const reloaded = service.itineraryRecordToTrip(id, records[id]);
  assert.equal(reloaded.days.length, 2);
  assert.equal(reloaded.days[0].places[0].entryId, 'z-first');
  assert.equal(reloaded.days[0].places[1].visitTime, '14:00');
  assert.equal(reloaded.days[0].places[1].displayTime, '2:00 PM');
  assert.equal(records[id].days.day2.order, 1);
  await service.saveItineraryToDatabase({ ...draft, itineraryId: id, days: [{ places: [stop('a-second', '15:30')] }] });
  assert.equal(Object.keys(records).length, 1);
  assert.equal(records[id].createdAt, originalCreatedAt);
  assert.equal(records[id].days.day1.places['a-second'].placeId, 'backend-a-second');
  assert.equal(records[id].days.day1.places['z-first'], undefined);
  await service.updateItineraryStatusInDatabase(id, 'Completed');
  assert.equal(records[id].status, 'Completed');
  await service.deleteItineraryFromDatabase(id);
  assert.equal(Object.keys(records).length, 0);
});
test('duplicate titles, wrong owners, invalid dates, times and boundaries fail before writing', async () => {
  const { service, writes } = setup({ old: { userId: 'user-1', tripName: 'My trip' }, other: { userId: 'someone-else', tripName: 'Private' } });
  await assert.rejects(service.saveItineraryToDatabase({ ...draft, tripName: ' my   TRIP ' }), /name|title/i);
  await assert.rejects(service.saveItineraryToDatabase({ ...draft, tripName: 'New', itineraryId: 'other' }), /another traveler/);
  await assert.rejects(service.saveItineraryToDatabase({ ...draft, travelDate: '2026-02-30' }), /date/);
  await assert.rejects(service.saveItineraryToDatabase({ ...draft, days: [{ places: [stop('bad', '24:88')] }] }), /visit time/);
  await assert.rejects(service.saveItineraryToDatabase({ ...draft, days: [{ places: [{ ...stop('outside'), latitude: 14.6 }] }] }), /outside Naga/);
  assert.equal(writes.length, 0);
});
test('signed-out and anonymous travelers cannot persist drafts or delete trips', async () => {
  for (const user of [null, { uid: 'anon', isAnonymous: true }]) {
    const { service, writes } = setup({}, user);
    await assert.rejects(service.saveItineraryToDatabase({ ...draft, status: 'Drafts' }), /Login/);
    await assert.rejects(service.deleteItineraryFromDatabase('trip'), /Login/);
    assert.equal(writes.length, 0);
  }
});
test('generation metadata and preference snapshot survive a save and reopen', async () => {
  const { service, records } = setup();
  const recommendation = { method: 'preference-matching-nearest-stop-v1', preferences: { places: ['Churches'] }, weatherUsed: true };
  const { id } = await service.saveItineraryToDatabase({ ...draft, recommendation });
  assert.equal(service.itineraryRecordToTrip(id, records[id]).recommendation.preferences.places[0], 'Churches');
});
