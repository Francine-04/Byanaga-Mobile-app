const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
const photo = { uri: 'local://photo.png', fileName: 'photo.png', mimeType: 'image/png' };
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function setup({ bytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], user = { uid: 'user-1' }, upload, commit, updateAuth } = {}) {
  const writes = [];
  const uploads = [];
  const auth = { currentUser: user };
  let record = { name: 'Old Name', bio: 'Old bio', image: 'old-avatar', coverImage: 'old-cover', preferences: { places: ['Nature'] } };
  const load = createLoader({
    'react-native': { Platform: { OS: 'web' } },
    'firebase/auth': { updateProfile: updateAuth || (async () => {}) },
    'firebase/storage': {
      ref: (_, path) => path,
      uploadBytes: async (path, blob, metadata) => { uploads.push([path, metadata]); await upload?.(path); },
      getDownloadURL: async (path) => 'https://example.com/' + path,
    },
    'firebase/database': {
      ref: (_, path) => path, serverTimestamp: () => 123,
      update: async (path, value) => { writes.push([path, plain(value)]); await commit?.(); record = { ...record, ...plain(value) }; },
    },
    './firebaseApp': { auth, realtimeDb: {}, storage: {} },
  }, { fetch: async () => ({ blob: async () => new Blob([new Uint8Array(bytes)]) }) });
  return { service: load('src/services/profilePhotoService.js'), writes, uploads, auth,
    reload: () => load('src/services/authService.js').travelerRecordToAppState(record, auth.currentUser) };
}
test('photo uploads return remote URLs without publishing partial profile changes', async () => {
  const { service, writes, uploads } = setup();
  for (const field of ['image', 'coverImage']) {
    const result = await service.uploadProfilePhoto('user-1', field, photo);
    assert.match(result, /^https:\/\/example.com\/users\/user-1\/photos\//);
  }
  assert.match(uploads[0][0], /^users\/user-1\/photos\/image-/);
  assert.match(uploads[1][0], /^users\/user-1\/photos\/coverImage-/);
  assert.equal(uploads[0][1].contentType, 'image/png');
  assert.equal(writes.length, 0);
});
test('JPEG files are accepted and invalid formats, fake PNGs and guests are rejected', async () => {
  const jpg = setup({ bytes: [0xff, 0xd8, 0xff, 0xe0] });
  await jpg.service.uploadProfilePhoto('user-1', 'image', { uri: 'local://photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' });
  assert.equal(jpg.uploads[0][1].contentType, 'image/jpeg');
  const invalid = setup({ bytes: [1, 2, 3, 4] });
  await assert.rejects(invalid.service.uploadProfilePhoto('user-1', 'image', photo), /JPG or PNG/);
  await assert.rejects(invalid.service.uploadProfilePhoto('user-1', 'image', { uri: 'local://photo.gif', fileName: 'photo.gif' }), /JPG or PNG/);
  for (const user of [null, { uid: 'user-1', isAnonymous: true }, { uid: 'other-user' }]) {
    const guest = setup({ user });
    await assert.rejects(guest.service.uploadProfilePhoto('user-1', 'image', photo), /log in/);
    await assert.rejects(guest.service.saveProfileEdits('user-1', { name: 'Test' }, { image: photo }), /log in/);
    assert.equal(guest.uploads.length, 0);
  }
  assert.equal(invalid.writes.length, 0);
});
test('Save uploads both photos concurrently, commits once, waits for acknowledgement and restores on login', async () => {
  const uploading = deferred();
  const committing = deferred();
  const harness = setup({ upload: () => uploading.promise, commit: () => committing.promise });
  let saved = false;
  const pending = harness.service.saveProfileEdits('user-1', { name: ' Ana Santos ', phone: ' 09171234567 ', bio: '', nationality: 'Filipino', image: photo.uri, coverImage: photo.uri }, { image: photo, coverImage: photo }).then((result) => { saved = true; return result; });
  await new Promise(setImmediate);
  assert.equal(harness.uploads.length, 2, 'both uploads start before either finishes');
  assert.equal(harness.writes.length, 0);
  uploading.resolve();
  await new Promise(setImmediate);
  assert.equal(harness.writes.length, 1);
  assert.equal(saved, false, 'Save does not succeed before Firebase acknowledges');
  assert.equal(harness.reload().profile.name, 'Old Name');
  committing.resolve();
  const result = await pending;
  harness.auth.currentUser = null;
  harness.auth.currentUser = { uid: 'user-1', displayName: 'Old Provider Name' };
  const restored = harness.reload();
  assert.equal(restored.profile.name, 'Ana Santos');
  assert.equal(restored.profile.firstName, 'Ana');
  assert.equal(restored.profile.phone, '09171234567');
  assert.equal(restored.profile.bio, '');
  assert.equal(restored.profile.nationality, 'Filipino');
  assert.equal(restored.profile.image, result.image);
  assert.equal(restored.profile.coverImage, result.coverImage);
  assert.deepEqual(plain(restored.preferences.places), ['Nature']);
  assert.equal(harness.writes[0][0], 'users/user-1');
});
test('an upload failure waits for other uploads, reports the error and leaves the stored profile unchanged', async () => {
  const remaining = deferred();
  const harness = setup({ upload: async (path) => { if (path.includes('/image-')) throw new Error('Storage permission denied'); await remaining.promise; } });
  let finished = false;
  const pending = harness.service.saveProfileEdits('user-1', { name: 'New Name' }, { image: photo, coverImage: photo });
  const check = assert.rejects(pending, /permission denied/).then(() => { finished = true; });
  await new Promise(setImmediate);
  assert.equal(finished, false);
  remaining.resolve();
  await check;
  assert.equal(harness.writes.length, 0);
  assert.equal(harness.reload().profile.image, 'old-avatar');
});
test('text-only edits skip uploads and do not wait for optional Auth display-name synchronization', async () => {
  const authUpdate = deferred();
  const harness = setup({ updateAuth: () => authUpdate.promise });
  try {
    const result = await harness.service.saveProfileEdits('user-1', { ...harness.reload().profile, name: 'New Name' });
    assert.equal(harness.uploads.length, 0);
    assert.equal(harness.writes.length, 1);
    assert.equal(result.image, 'old-avatar');
    assert.equal(result.coverImage, 'old-cover');
  } finally { authUpdate.resolve(); }
});
test('database failures and a changed session never report successful profile saving', async () => {
  const denied = setup({ commit: async () => { throw new Error('Database permission denied'); } });
  await assert.rejects(denied.service.saveProfileEdits('user-1', { name: 'New Name' }, { image: photo }), /permission denied/);
  assert.equal(denied.reload().profile.name, 'Old Name');
  const changed = setup({ upload: async () => { changed.auth.currentUser = { uid: 'someone-else' }; } });
  await assert.rejects(changed.service.saveProfileEdits('user-1', { name: 'New Name' }, { image: photo }), /session changed/);
  assert.equal(changed.writes.length, 0);
});
