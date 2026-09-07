import { matchByPreferences, weatherAdvice } from './preferenceMatching';
import { findKnownPlace } from '../data/nagaPlaces';
import { isCoordinateInsideNagaCity } from './nagaBoundary';

export function generateItinerary({ destinations = [], restaurants = [], preferences = {}, weather, travelDate = '' }) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const applicableWeather = !travelDate || travelDate === today ? weather : null;
  const seen = new Set();
  const candidates = [...destinations, ...restaurants.map((item) => ({ ...item, category: 'Food' }))].map((item) => {
    const known = findKnownPlace(item.name);
    return { ...item, latitude: item.latitude ?? known?.latitude, longitude: item.longitude ?? known?.longitude };
  }).filter((item) => {
    const key = String(item.name || '').trim().toLowerCase();
    if (!key || seen.has(key) || !isCoordinateInsideNagaCity(item.latitude, item.longitude)) return false;
    seen.add(key);
    return true;
  });
  const ranked = matchByPreferences(preferences, candidates, applicableWeather);
  const dayCount = preferences.duration === 'Weekend' ? 2 : 1;
  const perDay = preferences.duration === 'Half Day' ? 2 : 4;
  const days = Array.from({ length: dayCount }, (_, index) => ({
    id: `day-${index + 1}`, open: true,
    places: ranked.slice(index * perDay, (index + 1) * perDay).map((place, stopIndex) => {
      const hour = 8 + stopIndex * 2;
      const visitTime = `${String(hour).padStart(2, '0')}:00`;
      const displayTime = `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
      return { ...place, entryId: `suggested-${index}-${place.id}`, placeId: place.dashboardId || place.placeId || place.id,
        title: place.name, placeName: place.name, address: place.address || 'Naga City, Camarines Sur',
        visitTime, displayTime, time: displayTime, subtitle: 'Suggested visit time; adjust as needed' };
    }),
  })).filter((day) => day.places.length);
  return { days, advice: travelDate && travelDate !== today ? 'Check the forecast closer to your travel date. Current weather is not a forecast for this trip.' : weatherAdvice(applicableWeather).message };
}
