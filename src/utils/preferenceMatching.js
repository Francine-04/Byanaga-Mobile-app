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
  const priority = (place) => {
    const raw = (value) => String(value || '').trim().toLowerCase().replace(/^museums$/, 'museum');
    const values = [place.category, ...(Array.isArray(place.tags) ? place.tags : []), place.typeLabel];
    const exact = new Set(values.map(raw));
    const normalized = new Set(values.map(key));
    const selectedPlaces = preferences.places || [];
    const selectedActivities = preferences.activities || [];
    // Explicit place choices come before activities, weather and popularity.
    // Exact tags distinguish Historical and Museums from broad Culture aliases.
    if (selectedPlaces.some((choice) => exact.has(raw(choice)))) return 3;
    if (selectedPlaces.some((choice) => normalized.has(key(choice)))) return 2;
    if (selectedActivities.some((choice) => normalized.has(key(choice)))) return 1;
    return 0;
  };
  return [...destinations].sort((a, b) => priority(b) - priority(a)
    || preferenceScore(preferences, b, weather, now) - preferenceScore(preferences, a, weather, now)
    || Number(b.visitCount || 0) - Number(a.visitCount || 0) || Number(b.rating || 0) - Number(a.rating || 0));
}

export function recommendationDetails(preferences = {}, place = {}) {
  const tags = new Set([place.category, ...(Array.isArray(place.tags) ? place.tags : []), place.budget, place.priceRange, place.travelStyle].map(key));
  const interests = [...new Set([...(preferences.places || []), ...(preferences.activities || [])])];
  const matches = interests.filter((interest) => tags.has(key(interest)));
  const reasons = [];
  if (matches.length) reasons.push(`Recommended because you enjoy ${matches.join(', ').toLowerCase()}.`);
  if (preferences.travelStyle && tags.has(key(preferences.travelStyle))) reasons.push(`Fits your ${preferences.travelStyle.toLowerCase()} travel style.`);
  if (preferences.budget && tags.has(key(preferences.budget))) reasons.push(`Matches your ${preferences.budget.toLowerCase()} budget preference.`);
  const publishedDescription = String(place.description || '').trim();
  const hasDescription = publishedDescription && !/^(Tourism destination from the dashboard\.|Approved tourism business profile from the dashboard\.)$/i.test(publishedDescription) && !/lorem ipsum/i.test(publishedDescription);
  const category = String(place.category || '').trim();
  const name = place.name || 'This destination';
  const overview = hasDescription ? publishedDescription : `${name} is listed as ${category ? `a ${category.toLowerCase()} destination` : 'a destination'}${place.address ? ` at ${place.address}` : ' in Naga City'}.`;
  if (!reasons.length) {
    reasons.push(Number(place.visitCount) > 0
      ? 'Suggested based on recorded visitor interest; it is not a direct match to your saved preferences.'
      : `Suggested as an additional ${category ? `${category.toLowerCase()} ` : ''}stop to explore. Update your travel preferences for closer matches.`);
  }
  return {
    description: `${overview} ${reasons.join(' ')}`,
    tags: [...new Set([...matches, ...(preferences.travelStyle && tags.has(key(preferences.travelStyle)) ? [preferences.travelStyle] : [])])].slice(0, 3),
  };
}

// Build the visible cards across selected interests, not just the first three
// items in one large category. Never fill a personalized row with unrelated places.
export function personalizedRecommendations(preferences = {}, destinations = [], weather, now = Date.now(), limit = 3) {
  const interests = [...new Set((preferences.places?.length ? preferences.places : preferences.activities || []).map(key))];
  const ranked = matchByPreferences(preferences, destinations, weather, now);
  if (!interests.length) return ranked.slice(0, limit);
  const matches = (place, interest) => [place.category, ...(Array.isArray(place.tags) ? place.tags : []), place.typeLabel].map(key).includes(interest);
  const chosen = [];
  const used = new Set();
  // New selections are appended by the editor; include them in the visible row.
  for (const interest of [...interests].reverse()) {
    const next = ranked.find((place) => !used.has(place.id) && matches(place, interest));
    if (next) { chosen.push(next); used.add(next.id); }
    if (chosen.length === limit) return chosen;
  }
  for (const place of ranked) {
    if (!used.has(place.id) && interests.some((interest) => matches(place, interest))) {
      chosen.push(place); used.add(place.id);
    }
    if (chosen.length === limit) break;
  }
  return chosen;
}

export function weatherAdvice(weather, now = Date.now()) {
  const age = Number(now) - Date.parse(weather?.updatedAt);
  if (weather?.source !== 'open-meteo' || !(age >= 0 && age < 3600000)) return { indoor: false, message: 'Fresh weather unavailable. Suggestions use your preferences only.' };
  if (weather.rainChance >= 60 || weather.weatherCode >= 51) return { indoor: true, message: 'Rain is possible today. Indoor categories are prioritized; confirm shelter and opening hours.' };
  if (weather.apparentTemperature >= 35) return { indoor: true, message: 'Hot conditions today. Prefer indoor stops and take water breaks.' };
  return { indoor: false, message: 'Suggestions use current conditions. Check the forecast again before leaving.' };
}
