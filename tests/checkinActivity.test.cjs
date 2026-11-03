const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, plain } = require('./helpers/load.cjs');
const { visitDayKey, isCheckinActive, summarizeVisitDays, CHECKIN_TTL } = createLoader()('src/utils/checkinActivity.js');

test('Manila day changes at midnight, not at the device timezone boundary', () => {
  const midnight = Date.parse('2026-10-19T16:00:00Z');
  assert.equal(Number(visitDayKey(midnight)), Number(visitDayKey(midnight - 1)) + 1);
});
test('48-hour inactivity preserves the saved record', () => {
  const saved = { updatedAt: 1000 };
  assert.equal(isCheckinActive(saved, 1000 + CHECKIN_TTL - 1), true);
  assert.equal(isCheckinActive(saved, 1000 + CHECKIN_TTL), false);
  assert.equal(isCheckinActive(saved, 999), false);
  assert.equal(isCheckinActive(null), false);
  assert.equal(saved.updatedAt, 1000);
});
test('public day totals preserve history but only today and yesterday are recent', () => {
  const now = Date.parse('2026-10-20T12:00:00+08:00');
  const today = Number(visitDayKey(now));
  const result = summarizeVisitDays({ [today]: { p: 2 }, [today - 1]: { p: 3, q: 1 }, [today - 2]: { p: 4 }, [today + 1]: { p: 999 }, bad: { p: 999 } }, now);
  assert.deepEqual(plain(result), { p: { historicalVisits: 9, recentVisits: 5 }, q: { historicalVisits: 1, recentVisits: 1 } });
});
