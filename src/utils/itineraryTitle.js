export const DUPLICATE_ITINERARY_TITLE_CODE = 'itinerary/title-already-exists';

export function normalizeItineraryTitle(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function findDuplicateItineraryTitle(trips, title, currentItineraryId = null) {
  const comparableTitle = normalizeItineraryTitle(title).toLocaleLowerCase('en');
  if (!comparableTitle) return null;

  return (trips || []).find((trip) => (
    trip?.id !== currentItineraryId
    && normalizeItineraryTitle(trip?.name || trip?.tripName).toLocaleLowerCase('en') === comparableTitle
  )) || null;
}

export function createDuplicateItineraryTitleError(title) {
  const error = new Error(`You already have an itinerary named "${normalizeItineraryTitle(title)}". Choose a different trip name.`);
  error.code = DUPLICATE_ITINERARY_TITLE_CODE;
  return error;
}
