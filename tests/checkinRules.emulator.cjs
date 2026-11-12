// Run only against the local demo database; no real accounts or production data.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { ref, get, set, update, remove, serverTimestamp, increment } = require('firebase/database');
const { createLoader } = require('./helpers/load.cjs');
const { visitDayKey } = createLoader()('src/utils/checkinActivity.js');

async function main() {
  if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST) throw new Error('Local emulator required');
  const env = await initializeTestEnvironment({ projectId: 'demo-byanaga-checkins', database: { rules: fs.readFileSync('database.rules.json', 'utf8') } });
  const a = env.authenticatedContext('alice', { firebase: { sign_in_provider: 'password' } }).database();
  const b = env.authenticatedContext('bob', { firebase: { sign_in_provider: 'google.com' } }).database();
  const guest = env.unauthenticatedContext().database();
  const anon = env.authenticatedContext('anonymous', { firebase: { sign_in_provider: 'anonymous' } }).database();
  const day = visitDayKey();
  const updates = (uid, place = 'p', count = increment(1), visitDay = day) => ({
    [`checkins/${uid}/${place}`]: { placeId: place, updatedAt: serverTimestamp() },
    [`history/${uid}/${visitDay}/${place}`]: { visitedAt: serverTimestamp() },
    [`public/days/${visitDay}/${place}`]: count,
  });
  try {
    await env.clearDatabase();
    await env.withSecurityRulesDisabled(async (ctx) => set(ref(ctx.database(), 'crowd/places'), { p: { enabled: true }, q: { enabled: true }, disabled: { enabled: false } }));
    await assertFails(update(ref(guest, 'crowd'), updates('guest')));
    await assertFails(update(ref(anon, 'crowd'), updates('anonymous')));
    await assertFails(update(ref(a, 'crowd'), updates('bob')));
    await assertFails(update(ref(a, 'crowd'), updates('alice', 'unknown')));
    await assertFails(update(ref(a, 'crowd'), updates('alice', 'disabled')));
    await assertFails(update(ref(a, 'crowd'), updates('alice', 'p', 100)));
    await assertFails(set(ref(a, `crowd/public/days/${day}/p`), 1));
    await assertFails(set(ref(a, `crowd/history/alice/${day}/p`), { visitedAt: serverTimestamp() }));
    await assertFails(set(ref(a, 'crowd/checkins/alice/p'), { placeId: 'p', updatedAt: serverTimestamp() }));
    await assertFails(update(ref(a, 'crowd'), updates('alice', 'p', increment(1), String(Number(day) - 1))));
    const forged = updates('alice'); forged['checkins/alice/p'].updatedAt = 1;
    await assertFails(update(ref(a, 'crowd'), forged));
    const extra = updates('alice'); extra['history/alice/' + day + '/p'].email = 'private@example.invalid';
    await assertFails(update(ref(a, 'crowd'), extra));
    await assertSucceeds(update(ref(a, 'crowd'), updates('alice')));
    await assertSucceeds(get(ref(a, 'crowd/checkins/alice')));
    await assertSucceeds(get(ref(a, 'crowd/history/alice')));
    await assertFails(get(ref(b, 'crowd/checkins/alice')));
    await assertFails(get(ref(b, 'crowd/history/alice')));
    await assertFails(get(ref(guest, 'crowd')));
    await assertFails(get(ref(guest, 'crowd/checkins')));
    await assertSucceeds(get(ref(guest, 'crowd/public/days')));
    await assertFails(update(ref(a, 'crowd'), updates('alice')));
    await assertSucceeds(set(ref(a, 'crowd/checkins/alice/p'), { placeId: 'p', updatedAt: serverTimestamp() }));
    await assertSucceeds(update(ref(b, 'crowd'), updates('bob')));
    assert.equal((await get(ref(guest, `crowd/public/days/${day}/p`))).val(), 2);
    await assertSucceeds(update(ref(a, 'crowd'), updates('alice', 'q')));
    await assertSucceeds(remove(ref(a, 'crowd/checkins/alice/p')));
    assert.equal((await get(ref(a, 'crowd/checkins/alice/q'))).exists(), true);
    assert.equal((await get(ref(a, `crowd/history/alice/${day}/p`))).exists(), true);
    await assertFails(remove(ref(a, `crowd/history/alice/${day}/p`)));
    await assertFails(remove(ref(a, `crowd/public/days/${day}/p`)));
    await assertFails(set(ref(a, 'crowd/places/p/enabled'), false));
    await assertFails(remove(ref(a, 'crowd/checkins/bob/p')));
    await assertSucceeds(set(ref(a, 'crowd/checkins/alice/p'), { placeId: 'p', updatedAt: serverTimestamp() }));
    assert.equal((await get(ref(guest, `crowd/public/days/${day}/p`))).val(), 2);

    // Existing profile/trip ownership rules remain in force.
    await assertSucceeds(set(ref(a, 'users/alice'), { userId: 'alice', name: 'Test' }));
    await assertFails(get(ref(b, 'users/alice')));
    await assertSucceeds(set(ref(a, 'itineraries/test'), { userId: 'alice', tripName: 'Test', travelDate: '2026-10-20', status: 'draft', createdAt: 1, updatedAt: 1 }));
    await assertFails(get(ref(b, 'itineraries/test')));
    // Exercise the actual mobile service against rules, including simultaneous tabs.
    const service = createLoader({
      'firebase/database': require('firebase/database'),
      './firebaseApp': { auth: { currentUser: { uid: 'alice', isAnonymous: false } }, realtimeDb: a },
    })('src/services/checkinService.js');
    await env.withSecurityRulesDisabled(async (ctx) => set(ref(ctx.database(), 'crowd/places/r'), { enabled: true }));
    await Promise.all([service.checkIn({ id: 'r' }), service.checkIn({ id: 'r' })]);
    assert.equal((await get(ref(guest, `crowd/public/days/${day}/r`))).val(), 1);
    await service.checkOut({ id: 'r' });
    await service.checkIn({ id: 'r' });
    assert.equal((await get(ref(guest, `crowd/public/days/${day}/r`))).val(), 1);
    console.log('PASS: check-ins, private retrieval, multi-place renewal/checkout, paired counts, deduplication, malicious writes, and existing profile/trip ownership.');
  } finally { await env.cleanup(); }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
