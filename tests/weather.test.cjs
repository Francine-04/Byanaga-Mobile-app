const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');
const fixture = { current: { temperature_2m: 28.4, apparent_temperature: 31.2, weather_code: 2, relative_humidity_2m: 81, wind_speed_10m: 6, wind_direction_10m: 202.5, is_day: 0, time: '2026-09-08T20:15' }, hourly: { time: ['2026-09-08T20:00'], precipitation_probability: [45] } };
class WeatherClock extends Date {
  constructor(...args) { super(...(args.length ? args : ['2026-09-08T12:20:00Z'])); }
  static now() { return new WeatherClock().getTime(); }
}
function weather(fetch) { return createLoader({}, { fetch, Date: WeatherClock })('src/services/weatherService.js'); }
test('weather requests the Naga grid and Manila timezone, with current conditions and hourly rain chance', async () => {
  const result = await weather(async (url, options) => {
    const params = new URL(url).searchParams;
    assert.equal(params.get('latitude'), '13.624');
    assert.equal(params.get('longitude'), '123.185');
    assert.equal(params.get('timezone'), 'Asia/Manila');
    assert.equal(params.get('temperature_unit'), 'celsius');
    assert.equal(params.get('wind_speed_unit'), 'kmh');
    assert.equal(params.get('models'), 'best_match');
    assert.equal(params.get('cell_selection'), 'land');
    assert.equal(options.cache, 'no-store');
    return { ok: true, json: async () => fixture };
  }).fetchNagaWeather();
  assert.equal(result.temperature, 28);
  assert.equal(result.rainChance, 45);
  assert.equal(result.windDirection, 'SSW');
  assert.equal(result.isDay, false);
  assert.equal(result.region, 'Camarines Sur, Philippines');
});
test('missing rain/humidity/wind data remain unavailable, never fabricated values', async () => {
  const result = await weather(async () => ({ ok: true, json: async () => ({ current: { temperature_2m: 28, precipitation: 5, time: fixture.current.time } }) })).fetchNagaWeather();
  assert.equal(result.rainChance, null);
  assert.equal(result.humidity, null);
  assert.equal(result.windSpeed, null);
  assert.equal(result.windDirection, '');
});
test('HTTP, network and incomplete weather payloads fail explicitly', async () => {
  await assert.rejects(weather(async () => ({ ok: false, status: 429 })).fetchNagaWeather(), /429/);
  await assert.rejects(weather(async () => { throw new Error('offline'); }).fetchNagaWeather(), /offline/);
  await assert.rejects(weather(async () => ({ ok: true, json: async () => ({ current: { temperature_2m: null } }) })).fetchNagaWeather(), /incomplete/);
});

test('outdated, future and missing timestamps are never presented as current Naga weather', async () => {
  for (const time of ['2026-09-07T20:15', '2026-09-09T20:15', undefined, 'invalid']) {
    await assert.rejects(weather(async () => ({ ok: true, json: async () => ({ current: { ...fixture.current, time } }) })).fetchNagaWeather(), /out of date/);
  }
});

test('overlapping refreshes share one request but subsequent refreshes fetch new data', async () => {
  let calls = 0;
  let release;
  const response = new Promise((resolve) => { release = resolve; });
  const service = weather(async () => { calls++; await response; return { ok: true, json: async () => fixture }; });
  const first = service.fetchNagaWeather();
  const second = service.fetchNagaWeather();
  assert.equal(calls, 1);
  assert.equal(first, second);
  release();
  await first;
  await service.fetchNagaWeather();
  assert.equal(calls, 2);
});

test('a failed weather request can be retried', async () => {
  let calls = 0;
  const service = weather(async () => { if (++calls === 1) throw new Error('offline'); return { ok: true, json: async () => fixture }; });
  await assert.rejects(service.fetchNagaWeather(), /offline/);
  assert.equal((await service.fetchNagaWeather()).temperature, 28);
});
