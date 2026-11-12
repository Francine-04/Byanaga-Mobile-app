const aliases = { churches: 'church', religious: 'church', museums: 'culture', museum: 'culture', 'museum tour': 'culture', historical: 'culture', heritage: 'culture', cultural: 'culture', 'food trips': 'food', restaurant: 'food', cafe: 'food', parks: 'nature', mountains: 'nature', walking: 'nature', camping: 'nature', adventure: 'nature', 'family friendly': 'family', families: 'family', hotel: 'accommodation', festival: 'events' };
const key = (value) => aliases[String(value || '').trim().toLowerCase()] || String(value || '').trim().toLowerCase();

export function preferenceScore(preferences = {}, place, weather, now = Date.now()) {
  const selected = new Set([...(preferences.places || []), ...(preferences.activities || [])].map(key));
  const tags = new Set([place.category, ...(Array.isArray(place.tags) ? place.tags : []), place.budget, place.priceRange, place.travelStyle].map(key));
  const interests = [...selected].filter((choice) => tags.has(choice)).length;
  const sheltered = place.indoor === true || tags.has('indoor') || ['culture', 'church', 'food', 'shopping'].includes(key(place.category));
  return interests * 10 + (weatherAdvice(weather, now).indoor && sheltered ? 12 : 0)
    + (preferences.budget && tags.has(key(preferences.budget)) ? 3 : 0)
    + (preferences.travelStyle && tags.has(key(preferences.travelStyle)) ? 3 : 0);
}

export function matchByPreferences(preferences = {}, destinations = [], weather, now = Date.now()) {
  return [...destinations].sort((a, b) => preferenceScore(preferences, b, weather, now) - preferenceScore(preferences, a, weather, now)
    || Number(b.visitCount || 0) - Number(a.visitCount || 0) || Number(b.rating || 0) - Number(a.rating || 0));
}

export function weatherAdvice(weather, now = Date.now()) {
  const age = Number(now) - Date.parse(weather?.updatedAt);
  if (weather?.source !== 'open-meteo' || !(age >= 0 && age < 3600000)) return { indoor: false, message: 'Fresh weather unavailable. Suggestions use your preferences only.' };
  if (weather.rainChance >= 60 || weather.weatherCode >= 51) return { indoor: true, message: 'Rain is possible today. Indoor categories are prioritized; confirm shelter and opening hours.' };
  if (weather.apparentTemperature >= 35) return { indoor: true, message: 'Hot conditions today. Prefer indoor stops and take water breaks.' };
  return { indoor: false, message: 'Suggestions use current conditions. Check the forecast again before leaving.' };
}
