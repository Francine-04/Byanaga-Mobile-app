const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/utils/notificationFeed.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const now = Date.parse('2026-09-07T10:00:00+08:00');

test('offers exclude pending, expired, future and exhausted vouchers', async () => {
  const { buildNotificationFeed } = await modulePromise;
  const valid = { id: 'ok', status: 'approved', validFrom: now - 1000, validUntil: now + 1000, maxClaimLimit: 5, claimCount: 1 };
  const vouchers = [valid, { ...valid, id: 'pending', status: 'pending' }, { ...valid, id: 'expired', validUntil: now - 1 }, { ...valid, id: 'future', validFrom: now + 1 }, { ...valid, id: 'exhausted', claimCount: 5 }];
  assert.deepEqual(buildNotificationFeed({ vouchers, now }).map((item) => item.id), ['voucher-ok']);
});
test('events remain visible on their last day and remind at the stored Manila time', async () => {
  const { buildNotificationFeed } = await modulePromise;
  const event = { id: 'festival', title: 'Festival', status: 'upcoming', startDate: '2026-09-07T00:00:00+08:00', endDate: '2026-09-07T00:00:00+08:00', startTime: '14:00' };
  const items = buildNotificationFeed({ events: [event, { ...event, id: 'draft', status: 'draft' }], now });
  assert.equal(items.length, 2);
  assert.ok(items.some((item) => item.category === 'Travel Reminders'));
  assert.equal(buildNotificationFeed({ events: [event], now: now + 86400000 }).length, 0);
});
test('trip reminders exclude drafts and completed trips, and use Manila dates', async () => {
  const { buildNotificationFeed } = await modulePromise;
  const trip = { id: 'trip', status: 'Upcoming', travelDate: '2026-09-08' };
  const items = buildNotificationFeed({ trips: [trip, { ...trip, id: 'draft', status: 'Drafts' }, { ...trip, id: 'past', status: 'Completed' }], now });
  assert.equal(items.length, 1);
  assert.equal(items[0].createdAt, Date.parse('2026-09-07T00:00:00+08:00'));
});
test('heatmap notices exclude mock data and low crowd zones', async () => {
  const { buildNotificationFeed } = await modulePromise;
  const zone = { id: 'zone', source: 'dashboard', colorKey: 'crowded', count: 9 };
  assert.equal(buildNotificationFeed({ zones: [zone, { ...zone, source: 'mock' }, { ...zone, colorKey: 'low' }], now }).length, 1);
});
test('published establishment updates link back to the establishment profile', async () => {
  const { buildNotificationFeed } = await modulePromise;
  const [item] = buildNotificationFeed({
    establishmentPosts: [{
      id: 'post-1',
      establishmentId: 'business-1',
      establishmentName: 'Cafe Naga',
      category: 'Update',
      caption: 'Now serving breakfast.',
      status: 'published',
      createdAt: now,
    }],
    now,
  });
  assert.equal(item.title, 'Cafe Naga: Update');
  assert.equal(item.route, 'EstablishmentDetails');
  assert.equal(item.params.establishmentId, 'business-1');
});
