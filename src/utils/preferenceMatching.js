export function matchByPreferences(preferences, destinations, weather) {
  const selected = [...(preferences.places || []), ...(preferences.activities || [])];
  const aliases = { churches: 'church', museums: 'culture', 'museum tour': 'culture', historical: 'culture', 'food trips': 'food', restaurant: 'food', parks: 'nature', mountains: 'nature', walking: 'nature', camping: 'nature', adventure: 'nature' };
  const key = (value) => aliases[String(value).toLowerCase()] || String(value).toLowerCase();
  const indoor = weatherAdvice(weather).indoor;
  const score = (place) => {
    const tags = [place.category, ...(place.tags || [])].map(key);
    return selected.filter((choice) => tags.includes(key(choice))).length * 5
      + (indoor && ['culture', 'church', 'food', 'shopping'].includes(key(place.category)) ? 4 : 0)
      + (place.tags?.includes(preferences.budget) ? 2 : 0);
  };

  return [...destinations].sort((a, b) => {
    return score(b) - score(a) || Number(b.rating || 0) - Number(a.rating || 0);
  });
}

export function weatherAdvice(weather) {
  if (weather?.source !== 'open-meteo' || !(Math.abs(Date.now() - Date.parse(weather.updatedAt)) < 3600000)) return { indoor: false, message: 'Fresh weather unavailable. Suggestions use your preferences only.' };
  if (weather.rainChance >= 60 || weather.weatherCode >= 51) return { indoor: true, message: 'Rain is possible today. Indoor categories are prioritized; confirm shelter and opening hours.' };
  if (weather.apparentTemperature >= 35) return { indoor: true, message: 'Hot conditions today. Prefer indoor stops and take water breaks.' };
  return { indoor: false, message: 'Suggestions use current conditions. Check the forecast again before leaving.' };
}
