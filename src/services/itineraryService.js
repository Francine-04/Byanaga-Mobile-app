import { equalTo, onValue, orderByChild, push, query, ref, remove, serverTimestamp, set, update } from 'firebase/database';
import { realtimeDb } from './firebaseApp';
import { ensureAuthenticatedUser } from './authService';

const ITINERARIES_PATH = 'itineraries';

export async function saveItineraryToDatabase({ itineraryId, tripName, travelDate, status = 'Drafts', days = [], existingCreatedAt }) {
  const user = await ensureAuthenticatedUser();
  const itineraryRef = itineraryId ? ref(realtimeDb, `${ITINERARIES_PATH}/${itineraryId}`) : push(ref(realtimeDb, ITINERARIES_PATH));
  const id = itineraryRef.key;
  const record = {
    userId: user.uid,
    tripName: String(tripName || 'Untitled Trip').trim() || 'Untitled Trip',
    travelDate: travelDate || '',
    status,
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
    days: daysToRealtimeDatabase(days),
  };

  await set(itineraryRef, record);

  return {
    id,
    trip: itineraryRecordToTrip(id, {
      ...record,
      createdAt: existingCreatedAt || Date.now(),
      updatedAt: Date.now(),
    }),
  };
}

export function subscribeToUserItineraries(userId, onTrips, onError) {
  if (!userId) {
    onTrips([]);
    return () => {};
  }

  const userTripsQuery = query(ref(realtimeDb, ITINERARIES_PATH), orderByChild('userId'), equalTo(userId));

  return onValue(
    userTripsQuery,
    (snapshot) => {
      const trips = [];
      snapshot.forEach((child) => {
        trips.push(itineraryRecordToTrip(child.key, child.val()));
      });

      trips.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
      onTrips(trips);
    },
    onError
  );
}

export async function updateItineraryStatusInDatabase(itineraryId, status) {
  if (!itineraryId) {
    throw new Error('Missing itinerary ID.');
  }

  await update(ref(realtimeDb, `${ITINERARIES_PATH}/${itineraryId}`), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteItineraryFromDatabase(itineraryId) {
  if (!itineraryId) {
    throw new Error('Missing itinerary ID.');
  }

  await remove(ref(realtimeDb, `${ITINERARIES_PATH}/${itineraryId}`));
}

export function itineraryRecordToTrip(id, data = {}) {
  const days = realtimeDatabaseDaysToScreen(data.days);

  return {
    id,
    userId: data.userId || null,
    name: data.tripName || 'Untitled Trip',
    date: data.travelDate || 'Date not set',
    travelDate: data.travelDate || '',
    status: data.status || 'Drafts',
    days,
    places: days.reduce((total, day) => total + day.places.length, 0),
    image: null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function daysToRealtimeDatabase(days) {
  return days.reduce((payload, day, dayIndex) => {
    const dayKey = `day${dayIndex + 1}`;
    payload[dayKey] = {
      places: placesToRealtimeDatabase(day.places || []),
    };
    return payload;
  }, {});
}

function placesToRealtimeDatabase(places) {
  return places.reduce((payload, place, placeIndex) => {
    const entryId = sanitizeFirebaseKey(place.entryId || `place-${placeIndex + 1}-${place.placeId || place.destinationId || Date.now()}`);
    payload[entryId] = {
      placeId: String(place.placeId || place.destinationId || place.id || entryId),
      placeName: String(place.placeName || place.title || place.name || 'Untitled place'),
      address: String(place.address || 'Naga City'),
      latitude: toNumber(place.latitude),
      longitude: toNumber(place.longitude),
      visitTime: String(place.visitTime || place.time || ''),
      displayTime: String(place.displayTime || place.time || place.visitTime || ''),
    };
    return payload;
  }, {});
}

function realtimeDatabaseDaysToScreen(days = {}) {
  const dayEntries = Object.entries(days || {}).sort(([a], [b]) => dayNumber(a) - dayNumber(b));

  if (!dayEntries.length) {
    return [{ id: 'day-1', open: true, places: [] }];
  }

  return dayEntries.map(([dayKey, dayData], index) => ({
    id: `day-${index + 1}`,
    firebaseKey: dayKey,
    open: index === 0,
    places: Object.entries(dayData?.places || {}).map(([entryId, place]) => ({
      entryId,
      placeId: place.placeId || entryId,
      destinationId: place.placeId || entryId,
      title: place.placeName || 'Untitled place',
      placeName: place.placeName || 'Untitled place',
      address: place.address || 'Naga City',
      latitude: toNumber(place.latitude),
      longitude: toNumber(place.longitude),
      visitTime: place.visitTime || '',
      displayTime: place.displayTime || place.visitTime || '',
      time: place.displayTime || place.visitTime || 'Add time',
      source: 'firebase',
    })),
  }));
}

function dayNumber(dayKey) {
  const number = Number(String(dayKey).replace(/[^0-9]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function sanitizeFirebaseKey(value) {
  return String(value || `place-${Date.now()}`)
    .replace(/[.#$/[\]]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 90);
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
