const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');
const { getFirstName, getTimeGreeting } = createLoader()('src/utils/travelerGreeting.js');
test('greetings follow midnight, noon and 6 PM boundaries in Manila, regardless of device timezone', () => {
  for (const [time, period] of [['00:00', 'MORNING'], ['11:59', 'MORNING'], ['12:00', 'AFTERNOON'], ['17:59', 'AFTERNOON'], ['18:00', 'EVENING'], ['23:59', 'EVENING']]) {
    assert.equal(getTimeGreeting(new Date(`2026-09-08T${time}:00+08:00`)), `GOOD ${period},`);
  }
});
test('greeting uses the saved first name, with legacy full-name fallback', () => {
  assert.equal(getFirstName({ firstName: 'Maria', name: 'Maria Santos' }), 'Maria');
  assert.equal(getFirstName({ name: 'Ana Cruz' }), 'Ana');
  assert.equal(getFirstName(null), 'Traveler');
});
