const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
const { validateLoginForm, normalizeEmail } = createLoader()('src/utils/authValidation.js');

test('login accepts registered email domains and aliases without applying registration restrictions', () => {
  for (const email of ['person@gmail.com', ' PERSON@GMAIL.COM ', 'person@googlemail.com', 'person@outlook.com', 'person+@gmail.com']) {
    assert.deepEqual(plain(validateLoginForm({ email, password: 'existing-password' })), {}, email);
  }
  assert.equal(normalizeEmail(' PERSON@GMAIL.COM '), 'person@gmail.com');
});

test('login still rejects missing or malformed addresses and missing passwords', () => {
  for (const email of ['', 'person', 'person@', 'person@@gmail.com', 'per son@gmail.com']) {
    assert.ok(validateLoginForm({ email, password: 'existing-password' }).email);
  }
  assert.ok(validateLoginForm({ email: 'person@gmail.com', password: '' }).password);
});
