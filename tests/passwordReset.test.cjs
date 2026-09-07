const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const babel = require('@babel/core');

function load(relative, dependencies) {
  const { code } = babel.transformFileSync(path.join(__dirname, '..', relative), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] });
  const exports = {};
  vm.runInNewContext(code, { exports, require: (id) => {
    if (!(id in dependencies)) throw new Error(`Unexpected dependency: ${id}`);
    return dependencies[id];
  } });
  return exports;
}
const validation = load('src/utils/authValidation.js', {});
function service(overrides = {}) {
  return load('src/services/authService.js', {
    'react-native': { Platform: { OS: 'web' } },
    'firebase/auth': {
      sendPasswordResetEmail: async () => {},
      verifyPasswordResetCode: async () => 'traveler@gmail.com',
      confirmPasswordReset: async () => {},
      ...overrides,
    },
    'firebase/database': {},
    './firebaseApp': { auth: { name: 'existing-auth' } },
    '../utils/authValidation': validation,
  });
}
test('reset uses the existing Firebase Auth and normalizes the registered address', async () => {
  let calls = 0;
  await service({ sendPasswordResetEmail: async (auth, email) => { calls++; assert.equal(auth.name, 'existing-auth'); assert.equal(email, 'traveler@gmail.com'); } }).sendTravelerPasswordReset(' Traveler@Gmail.com ');
  assert.equal(calls, 1);
});
test('missing and invalid emails never send reset emails', async () => {
  const auth = service({ sendPasswordResetEmail: async () => { assert.fail('Must not send email'); } });
  for (const email of ['', 'invalid', 'name@example.com']) await assert.rejects(auth.sendTravelerPasswordReset(email), /Gmail/);
});
test('unknown accounts receive the same completion response', async () => {
  await service({ sendPasswordResetEmail: async () => { throw { code: 'auth/user-not-found' }; } }).sendTravelerPasswordReset('traveler@gmail.com');
});
test('network and rate-limit failures are reported', async () => {
  for (const code of ['auth/network-request-failed', 'auth/too-many-requests']) {
    await assert.rejects(service({ sendPasswordResetEmail: async () => { throw { code }; } }).sendTravelerPasswordReset('traveler@gmail.com'), (error) => error.code === code);
  }
});
test('reset action code is verified with the existing Firebase Auth instance', async () => {
  const resetCode = 'valid-reset-action-code';
  const authService = service({
    verifyPasswordResetCode: async (auth, code) => {
      assert.equal(auth.name, 'existing-auth');
      assert.equal(code, resetCode);
      return ' Traveler@Gmail.com ';
    },
  });

  assert.equal(await authService.verifyTravelerPasswordReset(resetCode), 'traveler@gmail.com');
});
test('confirmed password reset enforces BYANAGA password rules before Firebase', async () => {
  let confirmations = 0;
  const authService = service({
    confirmPasswordReset: async (auth, code, password) => {
      confirmations++;
      assert.equal(auth.name, 'existing-auth');
      assert.equal(code, 'valid-reset-action-code');
      assert.equal(password, 'Strong1!');
    },
  });

  await assert.rejects(authService.confirmTravelerPasswordReset({ oobCode: 'valid-reset-action-code', password: 'weak' }), /8-15/);
  assert.equal(confirmations, 0);
  await authService.confirmTravelerPasswordReset({ oobCode: 'valid-reset-action-code', password: 'Strong1!' });
  assert.equal(confirmations, 1);
});
