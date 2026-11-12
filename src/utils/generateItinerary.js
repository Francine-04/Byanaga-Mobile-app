import { matchByPreferences, recommendationDetails, weatherAdvice } from './preferenceMatching';
import { findKnownPlace, normalizePlaceKey } from '../data/nagaPlaces';
import { isCoordinateInsideNagaCity } from './nagaBoundary';
import { optimizeRoute } from './routeOptimization';
import { toEventDate } from './eventDate';
import { addTravelDays, manilaDate, parseTravelDate, parseVisitMinutes, visitTimeFields } from './travelSchedule';
import { normalizePreferences } from './travelerPreferences';
import { tripDayCount } from './tripDuration';

export function generateItinerary({ destinations = [], restaurants = [], events = [], preferences = {}, weather, travelDate = '', now = new Date() }) {
  const today = manilaDate(now);
  const date = travelDate || today;
  if (!parseTravelDate(date)) throw new Error('Select a valid travel date.');
  const selected = normalizePreferences(preferences);
  const raw = [...destinations, ...restaurants.map((place) => ({ ...place, category: 'Food' })),
    ...events.map((event) => ({ ...event, name: event.title, category: 'Events',
      eventId: event.id, address: event.venue, latitude: event.locationLat, longitude: event.locationLng,
      source: 'dashboard', sourceCollection: 'events', tags: [event.category, event.locationCategory] }))];
  const seen = new Set();
  const candidates = raw.map((place) => {
    const known = findKnownPlace(place.eventId ? place.address : place.name);
    return { ...place, latitude: place.latitude ?? known?.latitude, longitude: place.longitude ?? known?.longitude };
  }).filter((place) => {
    const id = normalizePlaceKey(place.name);
    if (!id || seen.has(id) || place.isActive === false || !isCoordinateInsideNagaCity(place.latitude, place.longitude)) return false;
    if (place.status && !['approved', 'upcoming', 'ongoing'].includes(place.status)) return false;
    seen.add(id);
    return true;
  });
  const used = new Set();
  const days = [];
  const dayCount = tripDayCount(selected.duration);
  const perDay = selected.duration === 'Half Day' ? 2 : 4;
  for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
    const dayDate = addTravelDays(date, dayIndex);
    const conditions = dayDate === today ? weather : null;
    const ranked = matchByPreferences(selected, candidates.filter((place) => !used.has(normalizePlaceKey(place.name)) && availableOnDate(place, dayDate)), conditions, now);
    const ordered = optimizeRoute(ranked.slice(0, perDay));
    let nextMinute = 8 * 60;
    const places = [];
    for (const place of ordered) {
      const window = visitWindow(place, dayDate);
      const minute = Math.max(nextMinute, window.start);
      if (minute >= window.end || minute >= (selected.duration === 'Half Day' ? 12 * 60 : 20 * 60)) continue;
      const placeId = String(place.dashboardId || place.placeId || place.id);
      const time = visitTimeFields(minute);
      const explanation = recommendationDetails(selected, place).description;
      const weatherNote = dayDate !== today
        ? 'Check the forecast closer to this travel date; current weather was not used.'
        : weatherAdvice(conditions, now).message;
      places.push({ ...place, entryId: `suggested-${dayIndex}-${places.length}-${placeId}`, placeId, destinationId: placeId,
        title: place.name, placeName: place.name, address: place.address || 'Naga City, Camarines Sur',
        recommendationReason: `${explanation} ${weatherNote}`,
        ...time, time: time.displayTime, subtitle: 'Suggested visit; confirm opening hours' });
      used.add(normalizePlaceKey(place.name));
      nextMinute = minute + 120;
    }
    days.push({ id: `day-${dayIndex + 1}`, date: dayDate, open: true, places });
  }
  const applicableWeather = date === today ? weather : null;
  const weatherAge = Number(now) - Date.parse(applicableWeather?.updatedAt);
  const stops = days.flatMap((day) => day.places);
  const matchedInterests = [...new Set(stops.flatMap((place) => recommendationDetails(selected, place).tags))];
  const categories = [...new Set(stops.map((place) => place.category).filter(Boolean))];
  const weatherSummary = date !== today ? 'Check the forecast closer to your travel date. Today\'s weather is not a forecast for this trip.' : weatherAdvice(applicableWeather, now).message;
  const summary = stops.length
    ? `Why visit these places? This itinerary brings together ${categories.join(', ').toLowerCase()} stops in Naga City${matchedInterests.length ? ` that include matches for your interests in ${matchedInterests.join(', ').toLowerCase()}` : ' for you to explore'}. The route is arranged to reduce travel between stops and fit your selected trip duration. ${weatherSummary} Confirm opening hours before visiting.`
    : weatherSummary;
  return {
    days: days.some((day) => day.places.length) ? days : [], travelDate: date,
    advice: `${summary}${stops.length && days.some((day) => !day.places.length) ? ' Some days have no suggested stops because there are not enough available places. You can add stops manually.' : ''}`,
    recommendation: {
      method: 'preference-matching-nearest-stop-v1', generatedAt: new Date(now).toISOString(),
      preferences: selected, travelDate: date,
      summary,
      weatherUsed: applicableWeather?.source === 'open-meteo' && weatherAge >= 0 && weatherAge < 3600000,
    },
  };
}

function availableOnDate(place, date) {
  if (place.eventId) {
    const start = toEventDate(place.startDate);
    const end = toEventDate(place.endDate) || start;
    if (!start || !end || date < manilaDate(start) || date > manilaDate(end)) return false;
  }
  const hours = hoursOnDate(place, date);
  return hours ? hours.isOpen !== false : place.isOpen !== false;
}

function hoursOnDate(place, date) {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(parseTravelDate(date)).toLowerCase();
  return Array.isArray(place.operatingHours) ? place.operatingHours.find((hours) => String(hours.day).toLowerCase().slice(0, 3) === weekday.slice(0, 3)) : null;
}

function visitWindow(place, date) {
  const hours = hoursOnDate(place, date);
  const start = parseVisitMinutes(place.eventId ? place.startTime : hours?.openTime) ?? 0;
  let end = parseVisitMinutes(place.eventId ? place.endTime : hours?.closeTime) ?? 1440;
  if (end <= start) end = 1440;
  return { start, end };
}
