const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');

const jpeg = { uri: 'file://avatar.jpg', fileName: 'avatar.jpg', mimeType: 'image/jpeg', base64: '/9j/AA==' };
const png = { uri: 'file://cover.png', fileName: 'cover.png', mimeType: 'image/png', base64: 'iVBORw0KGgoAAA==' };

function setup(user = { uid: 'user-1' }) {
  const writes = [];
  const auth = { currentUser: user };
  const service = createLoader({
    './firebaseApp': { auth },
    './authService': { saveTravelerProfile: async (uid, profile) => { writes.push({ uid, profile }); return profile; } },
  })('src/services/profilePhotoService.js');
  return { service, writes, auth };
}

test('selected photos and text save together without Firebase Storage', async () => {
  const { service, writes } = setup();
  const saved = await service.saveProfileEdits('user-1', { name: 'Ana', image: 'old-avatar', coverImage: 'old-cover' }, { image: jpeg, coverImage: png });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].uid, 'user-1');
  assert.match(saved.image, /^data:image\/jpeg;base64,/);
  assert.match(saved.coverImage, /^data:image\/png;base64,/);
});

test('text-only edits retain previously saved photos', async () => {
  const { service, writes } = setup();
  const saved = await service.saveProfileEdits('user-1', { name: 'Ana', image: 'old-avatar', coverImage: 'old-cover' });
  assert.equal(writes.length, 1);
  assert.equal(saved.image, 'old-avatar');
  assert.equal(saved.coverImage, 'old-cover');
});

test('invalid, missing and oversized photos fail before any profile write', async () => {
  const { service, writes } = setup();
  for (const asset of [
    { ...jpeg, base64: '' },
    { ...jpeg, base64: 'invalid' },
    { ...jpeg, base64: '/9j/' + 'A'.repeat(250000) },
    { ...jpeg, fileName: 'avatar.gif' },
  ]) {
    await assert.rejects(service.saveProfileEdits('user-1', { name: 'Ana' }, { image: asset }));
  }
  assert.equal(writes.length, 0);
});

test('guest and changed-session saves are rejected', async () => {
  for (const user of [null, { uid: 'other-user' }, { uid: 'user-1', isAnonymous: true }]) {
    const { service, writes } = setup(user);
    await assert.rejects(service.saveProfileEdits('user-1', { name: 'Ana' }, { image: jpeg }), /log in/);
    assert.equal(writes.length, 0);
  }
});
