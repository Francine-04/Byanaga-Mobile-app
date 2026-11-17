const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');

test('ten different tourists receive distinct codes and the eleventh is rejected', async () => {
  const records = new Map([['vouchers/offer', {
    status: 'approved', title: 'Offer', validFrom: new Date('2025-01-01'),
    validUntil: new Date('2030-01-01'), maxClaimLimit: 10, claimCount: 0,
  }]]);
  let sequence = 0;
  const auth = { currentUser: { uid: 'user-0', isAnonymous: false } };
  const firestore = {
    collection: (_db, name) => ({ path: name }),
    doc: (parent, name, id) => parent.path
      ? { path: `${parent.path}/${name || `random-${++sequence}`}`, id: name || `random-${sequence}` }
      : { path: `${name}/${id}`, id },
    query: () => ({}), where: () => ({}),
    getDocs: async () => ({ empty: true }),
    serverTimestamp: () => 'server-time',
    runTransaction: async (_db, callback) => callback({
      get: async (ref) => ({ exists: () => records.has(ref.path), data: () => records.get(ref.path) }),
      set: (ref, data) => records.set(ref.path, data),
      update: (ref, data) => records.set(ref.path, { ...records.get(ref.path), ...data }),
    }),
  };
  const load = createLoader({ 'firebase/firestore': firestore, './firebaseApp': { auth, db: {} } });
  const { claimVoucher } = load('src/services/voucherClaimService.js');
  const codes = new Set();
  for (let index = 0; index < 10; index++) {
    auth.currentUser = { uid: `user-${index}`, isAnonymous: false };
    const claim = await claimVoucher('offer', auth.currentUser.uid);
    assert.equal(claim.userId, auth.currentUser.uid);
    codes.add(claim.claimCode);
  }
  assert.equal(codes.size, 10);
  assert.equal(records.get('vouchers/offer').claimCount, 10);
  auth.currentUser = { uid: 'user-10', isAnonymous: false };
  await assert.rejects(claimVoucher('offer', 'user-10'), /claim limit/);
});
