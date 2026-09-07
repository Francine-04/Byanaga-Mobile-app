const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/eventDate.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('this-week events use a Monday-to-Sunday week in Manila', async () => {
  const { isEventInCurrentWeek } = await modulePromise;
  const now = new Date('2026-09-07T10:00:00+08:00');

  assert.equal(isEventInCurrentWeek({ startDate: '2026-09-07T00:00:00+08:00' }, now), true);
  assert.equal(isEventInCurrentWeek({ startDate: '2026-09-13T23:00:00+08:00' }, now), true);
  assert.equal(isEventInCurrentWeek({ startDate: '2026-09-14T00:00:00+08:00' }, now), false);
});

test('an event spanning into the current week is included', async () => {
  const { isEventInCurrentWeek } = await modulePromise;
  const now = new Date('2026-09-09T14:00:00+08:00');
  const event = {
    startDate: '2026-09-05T00:00:00+08:00',
    endDate: '2026-09-08T00:00:00+08:00',
  };

  assert.equal(isEventInCurrentWeek(event, now), true);
});

test('event date and time fields are formatted for display', async () => {
  const { formatEventDateRange, formatEventTimeRange } = await modulePromise;

  assert.equal(
    formatEventDateRange('2026-09-07T00:00:00+08:00', '2026-09-08T00:00:00+08:00'),
    'Sep 7, 2026 - Sep 8, 2026'
  );
  assert.equal(formatEventTimeRange('14:00', '16:30'), '2:00 PM - 4:30 PM');
});
