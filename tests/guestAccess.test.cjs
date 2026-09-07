const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/guestAccess.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('guest and signed-out travelers require login for itinerary access', async () => {
  const { isTravelerAccessRequired } = await modulePromise;

  assert.equal(isTravelerAccessRequired({ isGuestMode: true, firebaseUser: { uid: 'old-user' } }), true);
  assert.equal(isTravelerAccessRequired({ isGuestMode: false, firebaseUser: null, authReady: true }), true);
  assert.equal(isTravelerAccessRequired({ isGuestMode: false, firebaseUser: { uid: 'user-1', isAnonymous: false } }), false);
});

test('itinerary login redirects reset the root navigator with a message', async () => {
  const { redirectToLogin, ITINERARY_LOGIN_MESSAGE } = await modulePromise;
  let resetPayload = null;
  const root = {
    getState: () => ({ routeNames: ['Splash', 'Auth', 'Main'] }),
    reset: (payload) => { resetPayload = payload; },
  };
  const child = {
    getState: () => ({ routeNames: ['Home', 'Trips'] }),
    getParent: () => root,
  };

  redirectToLogin(child);

  assert.equal(resetPayload.routes[0].name, 'Auth');
  assert.equal(resetPayload.routes[0].params.screen, 'Login');
  assert.equal(resetPayload.routes[0].params.params.message, ITINERARY_LOGIN_MESSAGE);
});
