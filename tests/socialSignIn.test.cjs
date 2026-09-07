const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const babel = require('@babel/core');
const { code } = babel.transformFileSync(path.join(__dirname, '../src/services/authService.js'), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] });

function setup({ existing = null, failure, provider = 'google' } = {}) {
  let record = existing;
  const calls = [];
  const user = { uid: 'traveler-123', email: 'traveler@gmail.com', displayName: 'Maria Santos', emailVerified: true, providerData: [{ providerId: `${provider}.com` }] };
  class Provider { addScope() {} setCustomParameters() {} }
  const dependencies = {
    'react-native': { Platform: { OS: 'web' } },
    'firebase/auth': { GoogleAuthProvider: Provider, FacebookAuthProvider: Provider, signInWithPopup: async () => ({ user }) },
    'firebase/database': {
      ref: (_, location) => location,
      serverTimestamp: () => 1000,
      get: async (location) => { calls.push(['get', location]); if (failure === 'read') throw { code: 'PERMISSION_DENIED' }; return { exists: () => record !== null, val: () => record }; },
      set: async (location, data) => { calls.push(['set', location]); if (failure === 'write') throw { code: 'PERMISSION_DENIED' }; record = data; },
      update: async (location, data) => { calls.push(['update', location]); record = { ...record, ...data }; },
    },
    './firebaseApp': { auth: {}, realtimeDb: {} },
    '../utils/authValidation': {},
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: (id) => dependencies[id] });
  return { service: exports, calls };
}
for (const provider of ['google', 'facebook']) {
  test(`${provider} creates and reads a profile using the authenticated UID`, async () => {
    const { service, calls } = setup({ provider });
    const result = await service.signInWithWebSocialProvider(provider);
    assert.equal(result.record.userId, 'traveler-123');
    assert.equal(result.record.firstName, 'Maria');
    assert.equal(result.record.authProvider, provider);
    assert.deepEqual(calls, [['get', 'users/traveler-123'], ['set', 'users/traveler-123'], ['get', 'users/traveler-123']]);
  });
}
test('repeat sign-in updates the same record and preserves preferences and photos', async () => {
  const existing = { name: 'Custom Name', image: 'saved-avatar', coverImage: 'saved-cover', preferences: { places: ['Nature'] } };
  const { service, calls } = setup({ existing });
  const { record } = await service.signInWithWebSocialProvider('google');
  assert.equal(record.name, existing.name);
  assert.equal(record.image, existing.image);
  assert.equal(record.coverImage, existing.coverImage);
  assert.deepEqual(record.preferences, existing.preferences);
  assert.equal(calls.filter(([method]) => method === 'set').length, 0);
});
test('denied reads and writes fail explicitly rather than reporting a saved profile', async () => {
  for (const failure of ['read', 'write']) {
    const { service } = setup({ failure });
    await assert.rejects(service.signInWithWebSocialProvider('google'), (error) => error.code === 'auth/profile-permission-denied' && error.message.includes('Database permissions'));
  }
});
