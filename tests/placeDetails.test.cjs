const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');
const { visiblePlaceDetail } = createLoader()('src/utils/placeDetails.js');

test('hides sample copy and missing-value labels', () => {
  for (const value of [undefined, null, '', 'Sample schedule', 'Placeholder', 'Not connected',
    'Not provided', 'Not listed', 'Rate TBD', 'A mock prototype destination.',
    'A sample local dining stop for your Naga City itinerary.']) {
    assert.equal(visiblePlaceDetail(value), '');
  }
});
test('preserves real supplied details', () => {
  for (const value of ['9 AM – 5 PM', 'Free', 'Naga City, Camarines Sur', 'A local restaurant.']) {
    assert.equal(visiblePlaceDetail(value), value);
  }
});
