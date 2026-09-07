const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/itineraryTitle.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('trip titles are compared without case or repeated spaces', async () => {
  const { findDuplicateItineraryTitle } = await modulePromise;
  const trips = [{ id: 'trip-1', name: 'My Naga City Trip' }];

  assert.equal(findDuplicateItineraryTitle(trips, '  my   naga city trip  ')?.id, 'trip-1');
});

test('an itinerary may keep its own title while being edited', async () => {
  const { findDuplicateItineraryTitle } = await modulePromise;
  const trips = [{ id: 'trip-1', name: 'Weekend Tour' }];

  assert.equal(findDuplicateItineraryTitle(trips, 'Weekend Tour', 'trip-1'), null);
});

test('renaming an itinerary to another saved title is rejected', async () => {
  const { findDuplicateItineraryTitle } = await modulePromise;
  const trips = [
    { id: 'trip-1', name: 'Church Tour' },
    { id: 'trip-2', name: 'Food Tour' },
  ];

  assert.equal(findDuplicateItineraryTitle(trips, ' church tour ', 'trip-2')?.id, 'trip-1');
});
