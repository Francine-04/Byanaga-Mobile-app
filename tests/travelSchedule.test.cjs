const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
const schedule = createLoader()('src/utils/travelSchedule.js');
test('picked travel dates remain calendar dates across month, leap year and timezone boundaries', () => {
  assert.equal(schedule.parseTravelDate('2026-02-30'), null);
  assert.equal(schedule.parseTravelDate('2025-02-29'), null);
  assert.equal(schedule.formatTravelDate(schedule.parseTravelDate('2028-02-29')), '2028-02-29');
  assert.equal(schedule.addTravelDays('2026-12-31', 1), '2027-01-01');
  assert.equal(schedule.manilaDate(new Date('2026-09-07T16:05:00Z')), '2026-09-08');
});
test('visit time picker output is stored in 24-hour form and displayed in 12-hour form', () => {
  for (const [input, visitTime, displayTime] of [['12:00 AM', '00:00', '12:00 AM'], ['12:00 PM', '12:00', '12:00 PM'], ['23:55', '23:55', '11:55 PM'], ['8:05 AM', '08:05', '8:05 AM']]) {
    assert.deepEqual(plain(schedule.visitTimeFields(input)), { visitTime, displayTime });
  }
  for (const invalid of ['', '24:00', '12:60', '0:00 AM', '13:00 PM']) assert.equal(schedule.visitTimeFields(invalid), null);
});
