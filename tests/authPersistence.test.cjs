const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const babel = require('@babel/core');

const { code } = babel.transformFileSync(path.join(__dirname, '../src/services/authService.js'), {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

function setup(initialRecord = null) {
  let record = initialRecord;
  const calls = [];
  const user = {
    uid: 'tourist-1',
    email: 'maria@gmail.com',
    displayName: 'Maria Santos',
    emailVerified: false,
    photoURL: null,
    providerData: [{ providerId: 'password' }],
  };
  class Provider { addScope() {} setCustomParameters() {} }
  const authModule = {
    GoogleAuthProvider: Provider,
    FacebookAuthProvider: Provider,
    OAuthProvider: Provider,
    createUserWithEmailAndPassword: async () => ({ user }),
    signInWithEmailAndPassword: async () => ({ user }),
    updateProfile: async () => {},
    deleteUser: async () => {},
    onAuthStateChanged: () => () => {},
    signOut: async () => {},
    sendPasswordResetEmail: async () => {},
  };
  const databaseModule = {
    ref: (_, location) => location,
    serverTimestamp: () => 1234,
    get: async (location) => {
      calls.push(['get', location]);
      return { exists: () => record !== null, val: () => record };
    },
    set: async (location, value) => {
      calls.push(['set', location, value]);
      record = value;
    },
    update: async (location, value) => {
      calls.push(['update', location, value]);
      record = { ...record, ...value };
    },
  };
  const dependencies = {
    'react-native': { Platform: { OS: 'web' } },
    'firebase/auth': authModule,
    'firebase/database': databaseModule,
    './firebaseApp': { auth: {}, realtimeDb: {} },
    '../utils/authValidation': {
      normalizeEmail: (value) => String(value || '').trim().toLowerCase(),
      isGmailAddress: () => true,
    },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: (id) => dependencies[id] });
  return { service: exports, calls };
}

test('registration saves the traveler profile and preferences under the authenticated UID', async () => {
  const { service, calls } = setup();
  const result = await service.registerTraveler({
    email: 'maria@gmail.com',
    password: 'Secure1!',
    profile: { firstName: 'Maria', lastName: 'Santos', name: 'Maria Santos', age: 24, gender: 'FEMALE', nationality: 'Filipino' },
    preferences: { places: ['Food'], activities: ['Food Trips'], travelStyle: 'Solo', budget: 'Moderate', duration: 'One Day' },
  });
  const write = calls.find(([method]) => method === 'set');
  assert.equal(write[1], 'users/tourist-1');
  assert.equal(write[2].role, 'tourist');
  assert.deepEqual(write[2].preferences.places, ['Food']);
  assert.equal(Object.hasOwn(write[2], 'password'), false);
  assert.equal(result.record.userId, 'tourist-1');
});

test('login refreshes the same backend traveler record instead of creating another one', async () => {
  const { service, calls } = setup({ userId: 'tourist-1', name: 'Maria Santos', preferences: { places: ['Nature'] } });
  const result = await service.loginTraveler({ email: 'maria@gmail.com', password: 'Secure1!' });
  assert.equal(result.createdTravelerRecord, false);
  assert.equal(calls.filter(([method]) => method === 'set').length, 0);
  assert.equal(calls.filter(([method]) => method === 'update').length, 1);
  assert.equal(result.record.userId, 'tourist-1');
});
