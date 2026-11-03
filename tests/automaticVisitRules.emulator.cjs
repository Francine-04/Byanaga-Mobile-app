const fs = require('node:fs');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const sdk = require('firebase/database');
const { ref, get, set, update, remove, serverTimestamp, increment } = sdk;
const { createLoader } = require('./helpers/load.cjs');
const { visitDayKey } = createLoader()('src/utils/checkinActivity.js');

async function main() {
  if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST) throw new Error('Local emulator required');
  const env = await initializeTestEnvironment({ projectId: 'demo-byanaga-checkins', database: { rules: fs.readFileSync('database.rules.json', 'utf8') } });
  const a = env.authenticatedContext('alice', { firebase: { sign_in_provider: 'password' } }).database();
  const b = env.authenticatedContext('bob', { firebase: { sign_in_provider: 'google.com' } }).database();
  const guest = env.unauthenticatedContext().database();
  const anonymous = env.authenticatedContext('anon', { firebase: { sign_in_provider: 'anonymous' } }).database();
  const day = Number(visitDayKey());
  const consent = (enabled) => ({ enabled, version: 1, updatedAt: serverTimestamp() });
  const arrival = (uid, place = 'p', sequence = 1) => ({
    [`autoState/${uid}/${place}`]: { phase: 'inside', sequence, eventDay: day, updatedAt: serverTimestamp(), observedAt: Date.now() },
    [`autoVisits/${uid}/${place}/${sequence}`]: { visitorId: uid, destinationId: place, visitDay: day, timestamp: serverTimestamp() },
    [`autoDays/${day}/${place}`]: increment(1),
  });
  const ageState = (uid, place = 'p') => env.withSecurityRulesDisabled(async (ctx) => update(ref(ctx.database(), `crowd/autoState/${uid}/${place}`), { updatedAt: Date.now() - 20000 }));
  try {
    await env.clearDatabase();
    await env.withSecurityRulesDisabled(async (ctx) => set(ref(ctx.database(), 'crowd/places'), { p: { enabled: true, automaticEnabled: true }, q: { enabled: true, automaticEnabled: true }, disabled: { enabled: true, automaticEnabled: false } }));
    await assertFails(update(ref(a, 'crowd'), arrival('alice')));
    await assertFails(set(ref(guest, 'crowd/consents/alice'), consent(true)));
    await assertFails(set(ref(anonymous, 'crowd/consents/anon'), consent(true)));
    await assertSucceeds(set(ref(a, 'crowd/consents/alice'), consent(true)));
    await assertSucceeds(set(ref(b, 'crowd/consents/bob'), consent(true)));
    await assertFails(set(ref(a, 'crowd/consents/bob'), consent(false)));
    await assertFails(update(ref(a, 'crowd'), arrival('bob')));
    await assertFails(update(ref(a, 'crowd'), arrival('alice', 'disabled')));
    await assertFails(update(ref(a, 'crowd'), arrival('alice', 'unknown')));
    await assertFails(get(ref(guest, 'crowd/consents/alice')));
    const forged = arrival('alice'); forged[`autoDays/${day}/p`] = 100;
    await assertFails(update(ref(a, 'crowd'), forged));
    const stale = arrival('alice'); stale['autoState/alice/p'].observedAt = Date.now() - 60000;
    await assertFails(update(ref(a, 'crowd'), stale));
    const noCount = arrival('alice'); delete noCount[`autoDays/${day}/p`];
    await assertFails(update(ref(a, 'crowd'), noCount));
    await assertFails(set(ref(a, `crowd/autoDays/${day}/p`), 1));
    await assertSucceeds(update(ref(a, 'crowd'), arrival('alice')));
    const raw = arrival('bob'); raw['autoVisits/bob/p/1'].latitude = 13.62;
    await assertFails(update(ref(b, 'crowd'), raw));
    await assertSucceeds(get(ref(a, 'crowd/autoVisits/alice')));
    await assertFails(get(ref(b, 'crowd/autoVisits/alice')));
    await assertFails(get(ref(b, 'crowd/autoState/alice')));
    await assertFails(get(ref(guest, 'crowd/autoVisits')));
    await assertSucceeds(get(ref(guest, 'crowd/autoDays')));
    await assertFails(update(ref(a, 'crowd'), arrival('alice', 'p', 2)));
    await assertFails(remove(ref(a, 'crowd/autoState/alice/p')));
    await assertFails(remove(ref(a, 'crowd/autoVisits/alice/p/1')));
    await assertFails(remove(ref(a, `crowd/autoDays/${day}/p`)));
    await assertFails(set(ref(a, 'crowd/activityConfig'), { moderate: 1, busy: 2, crowded: 3 }));
    await assertSucceeds(update(ref(b, 'crowd'), arrival('bob')));
    assert.equal((await get(ref(guest, `crowd/autoDays/${day}/p`))).val(), 2);
    await ageState('alice');
    await assertSucceeds(set(ref(a, 'crowd/autoState/alice/p'), { phase: 'outside', sequence: 1, eventDay: day, updatedAt: serverTimestamp(), observedAt: Date.now() }));
    await assertFails(update(ref(a, 'crowd'), arrival('alice', 'p', 2))); // too rapid
    await ageState('alice');
    await assertSucceeds(update(ref(a, 'crowd'), arrival('alice', 'p', 2)));
    assert.equal((await get(ref(guest, `crowd/autoDays/${day}/p`))).val(), 3);
    assert.equal(Object.keys((await get(ref(a, 'crowd/autoVisits/alice/p'))).val()).length, 2);
    await assertSucceeds(set(ref(a, 'crowd/consents/alice'), consent(false)));
    await assertFails(update(ref(a, 'crowd'), arrival('alice', 'q')));
    await assertSucceeds(set(ref(a, 'crowd/consents/alice'), consent(true)));
    const service = createLoader({ 'firebase/database': sdk, './firebaseApp': { auth: { currentUser: { uid: 'alice', isAnonymous: false } }, realtimeDb: a } })('src/services/automaticVisitService.js');
    await service.saveAutoTransition('q', 'inside', null, () => false, Date.now());
    assert.equal((await get(ref(a, 'crowd/autoState/alice/q'))).exists(), false);
    await Promise.allSettled([
      service.saveAutoTransition('q', 'inside', null, () => true, Date.now()),
      service.saveAutoTransition('q', 'inside', null, () => true, Date.now()),
    ]);
    await service.saveAutoTransition('q', 'inside', null, () => true, Date.now());
    assert.equal((await get(ref(guest, `crowd/autoDays/${day}/q`))).val(), 1);
    const totals = await get(ref(guest, 'crowd/autoDays'));
    assert.equal(JSON.stringify(totals.val()).includes('alice'), false);
    console.log('PASS automatic-visit security/service: consent, private reads, paired writes, duplicate/deletion protection, departure/return, timestamps and shared totals.');
  } finally { await env.cleanup(); }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
