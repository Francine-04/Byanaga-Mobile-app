const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');
const { weatherIcon } = createLoader()('src/utils/weatherIcon.js');
test('clear and partly cloudy weather use day/night icons', () => {
  assert.equal(weatherIcon('Mainly Clear', true).name, 'sunny');
  assert.equal(weatherIcon('Mainly Clear', false).name, 'moon');
  assert.equal(weatherIcon('Partly Cloudy', true).name, 'partly-sunny');
  assert.equal(weatherIcon('Partly Cloudy', false).name, 'cloudy-night');
});
test('rain, storms and unavailable readings do not appear sunny', () => {
  assert.equal(weatherIcon('Light Rain', true).name, 'rainy');
  assert.equal(weatherIcon('Thunderstorm', false).name, 'thunderstorm');
  assert.equal(weatherIcon('Cloudy', true).name, 'cloud');
  assert.equal(weatherIcon('Weather unavailable', true).name, 'help-circle-outline');
});
