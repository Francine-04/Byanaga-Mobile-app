const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const NAGA_WEATHER_COORDS = { latitude: 13.624, longitude: 123.185 };
const NAGA_TIMEZONE = 'Asia/Manila';

export const fallbackWeather = {
  city: 'Naga City',
  condition: 'Partly Cloudy',
  temperature: 26,
  temperatureLabel: '26\u00B0C',
  apparentTemperature: 28,
  humidity: 82,
  windSpeed: 12,
  windDirection: 'NE',
  rainChance: 20,
  weatherCode: 2,
  isDay: true,
  description: 'Sample weather',
  source: 'sample',
  observedAt: null,
  updatedAt: null,
};

export async function fetchNagaWeather() {
  const params = new URLSearchParams({
    latitude: String(NAGA_WEATHER_COORDS.latitude),
    longitude: String(NAGA_WEATHER_COORDS.longitude),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'showers',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: 'precipitation_probability',
    timezone: NAGA_TIMEZONE,
    forecast_days: '1',
    wind_speed_unit: 'kmh',
  });

  const response = await fetch(`${OPEN_METEO_FORECAST_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const current = data?.current;
  if (!current || !Number.isFinite(Number(current.temperature_2m))) {
    throw new Error('Weather service returned incomplete current conditions.');
  }

  const temperature = roundNumber(current.temperature_2m, fallbackWeather.temperature);
  const apparentTemperature = roundNumber(current.apparent_temperature, temperature);
  const weatherCode = roundNumber(current.weather_code, fallbackWeather.weatherCode);
  const isDay = Number(current.is_day) === 1;
  const condition = getWeatherDescription(weatherCode, isDay);
  const humidity = clampPercentage(current.relative_humidity_2m, fallbackWeather.humidity);
  const windSpeed = roundNumber(current.wind_speed_10m, fallbackWeather.windSpeed);
  const windDirection = getCompassDirection(current.wind_direction_10m);
  const rainChance = getCurrentRainChance(data.hourly, current.time) ?? deriveRainChance(current);

  return {
    city: 'Naga City',
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

function deriveRainChance(current) {
  const precipitation = Number(current?.precipitation ?? 0) + Number(current?.rain ?? 0) + Number(current?.showers ?? 0);
  if (!Number.isFinite(precipitation)) return fallbackWeather.rainChance;
  if (precipitation > 0) return 80;
  return 0;
}

function getCompassDirection(degrees) {
  const value = Number(degrees);
  if (!Number.isFinite(value)) return fallbackWeather.windDirection;
  const labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return labels[Math.round(value / 22.5) % labels.length];
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
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : fallback;
}

function clampPercentage(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}
