const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const babel = require('@babel/core');

function load(relative) {
  const { code } = babel.transformFileSync(path.join(__dirname, '..', relative), {
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const exports = {};
  vm.runInNewContext(code, { exports, require: () => { throw new Error('Unexpected dependency'); } });
  return exports;
}

const resetAction = load('src/utils/passwordResetAction.js');

test('parses a Firebase password reset action URL', () => {
  const action = resetAction.parsePasswordResetLink('https://app.example/reset?mode=resetPassword&oobCode=abc_DEF-123456&apiKey=hidden');
  assert.deepEqual({ ...action }, { mode: 'resetPassword', oobCode: 'abc_DEF-123456' });
});

test('parses an encoded nested mobile action link', () => {
  const nested = encodeURIComponent('byanaga://reset?mode=resetPassword&oobCode=nested-code-12345');
  const action = resetAction.parsePasswordResetLink(`https://example.test/?link=${nested}`);
  assert.deepEqual({ ...action }, { mode: 'resetPassword', oobCode: 'nested-code-12345' });
});

test('rejects unrelated modes and malformed short codes', () => {
  assert.equal(resetAction.parsePasswordResetLink('https://app.example/?mode=verifyEmail&oobCode=valid-looking-code'), null);
  assert.equal(resetAction.parsePasswordResetLink('short'), null);
  assert.equal(resetAction.parsePasswordResetLink('not a reset code'), null);
});

test('accepts route parameters supplied by the root navigator', () => {
  const action = resetAction.getPasswordResetAction({ mode: 'resetPassword', oobCode: 'route-code-12345' });
  assert.deepEqual({ ...action }, { mode: 'resetPassword', oobCode: 'route-code-12345' });
});
