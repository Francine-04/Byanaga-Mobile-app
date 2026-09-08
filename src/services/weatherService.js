const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const NAGA_WEATHER_COORDS = { latitude: 13.624, longitude: 123.185 };
const NAGA_TIMEZONE = 'Asia/Manila';
let pendingWeatherRequest = null;

export const fallbackWeather = {
  city: 'Naga City',
  condition: 'Weather unavailable',
  temperature: null,
  temperatureLabel: '--',
  apparentTemperature: null,
  humidity: null,
  windSpeed: null,
  windDirection: '',
  rainChance: null,
  weatherCode: null,
  isDay: true,
  description: 'Weather unavailable',
  source: 'unavailable',
  observedAt: null,
  updatedAt: null,
};

export function fetchNagaWeather() {
  if (!pendingWeatherRequest) {
    pendingWeatherRequest = requestNagaWeather().finally(() => { pendingWeatherRequest = null; });
  }
  return pendingWeatherRequest;
}

async function requestNagaWeather() {
  const params = new URLSearchParams({
    latitude: String(NAGA_WEATHER_COORDS.latitude),
    longitude: String(NAGA_WEATHER_COORDS.longitude),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(','),
    hourly: 'precipitation_probability',
    timezone: NAGA_TIMEZONE,
    forecast_days: '1',
    models: 'best_match',
    cell_selection: 'land',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let data;
  try {
    const response = await fetch(`${OPEN_METEO_FORECAST_URL}?${params.toString()}`, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}.`);
    }
    data = await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Weather request timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
  const current = data?.current;
  if (!current || current.temperature_2m == null || !Number.isFinite(Number(current.temperature_2m))) {
    throw new Error('Weather service returned incomplete current conditions.');
  }
  // API times use Asia/Manila, not the phone's timezone. Never present old data as current.
  const readingTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(current.time || '')
    ? Date.parse(`${current.time}+08:00`) : NaN;
  const age = Date.now() - readingTime;
  if (!Number.isFinite(age) || age > 90 * 60 * 1000 || age < -30 * 60 * 1000) {
    throw new Error('Current Naga City weather is unavailable or out of date. Please refresh again.');
  }

  const temperature = roundNumber(current.temperature_2m, fallbackWeather.temperature);
  const apparentTemperature = roundNumber(current.apparent_temperature, temperature);
  const weatherCode = roundNumber(current.weather_code, fallbackWeather.weatherCode);
  const hour = Number(current.time.slice(11, 13));
  const isDay = current.is_day == null ? hour >= 6 && hour < 18 : Number(current.is_day) === 1;
  const condition = getWeatherDescription(weatherCode, isDay);
  const humidity = clampPercentage(current.relative_humidity_2m, fallbackWeather.humidity);
  const windSpeed = roundNumber(current.wind_speed_10m, fallbackWeather.windSpeed);
  const windDirection = getCompassDirection(current.wind_direction_10m);
  const rainChance = getCurrentRainChance(data.hourly, current.time);

  return {
    city: 'Naga City',
    region: 'Camarines Sur, Philippines',
    condition,
    temperature,
    temperatureLabel: `${temperature}\u00B0C`,
    apparentTemperature,
    humidity,
    windSpeed,
    windDirection,
    rainChance,
    weatherCode,
    isDay,
    description: condition,
    source: 'open-meteo',
    observedAt: current.time || null,
    updatedAt: new Date().toISOString(),
  };
}

function getCurrentRainChance(hourly, currentTime) {
  if (!Array.isArray(hourly?.time) || !Array.isArray(hourly?.precipitation_probability)) {
    return null;
  }

  const currentHour = String(currentTime || '').slice(0, 13);
  const matchIndex = hourly.time.findIndex((time) => String(time).slice(0, 13) === currentHour);
  if (matchIndex < 0) return null;

  return clampPercentage(hourly.precipitation_probability[matchIndex], fallbackWeather.rainChance);
}

function getCompassDirection(degrees) {
  if (degrees == null || degrees === '') return '';
  const value = Number(degrees);
  if (!Number.isFinite(value)) return fallbackWeather.windDirection;
  const labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return labels[((Math.round(value / 22.5) % labels.length) + labels.length) % labels.length];
}

function getWeatherDescription(code, isDay) {
  const descriptions = {
    0: isDay ? 'Sunny' : 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Cloudy',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    56: 'Freezing Drizzle',
    57: 'Freezing Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    66: 'Freezing Rain',
    67: 'Freezing Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Light Showers',
    81: 'Showers',
    82: 'Heavy Showers',
    85: 'Snow Showers',
    86: 'Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm',
  };

  return descriptions[code] || fallbackWeather.condition;
}

function roundNumber(value, fallback) {
  if (value == null || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : fallback;
}

function clampPercentage(value, fallback) {
  if (value == null || value === '') return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}
