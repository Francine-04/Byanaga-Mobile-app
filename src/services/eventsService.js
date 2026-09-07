import { collection, onSnapshot } from 'firebase/firestore';
import { getPlaceImage } from '../data/placeImages';
import { getBackendImage, getBackendImages } from '../utils/backendImages';
import { formatEventDateRange, formatEventTimeRange, toEventDate } from '../utils/eventDate';
import { db } from './firebaseApp';

const ACTIVE_STATUSES = new Set(['upcoming', 'ongoing']);

export function subscribeToDashboardEvents(onEvents, onError) {
  return onSnapshot(
    collection(db, 'events'),
    (snapshot) => {
      const events = snapshot.docs
        .map((doc) => normalizeEvent(doc.id, doc.data()))
        .filter(isPublishedUpcoming)
        .sort((a, b) => a.sortTime - b.sortTime);

      onEvents(events);
    },
    onError
  );
}

export function createEventNotification(event) {
  return {
    id: `dashboard-event-${event.id}`,
    category: 'Events',
    title: `New event: ${event.title}`,
    message: `${event.date} at ${event.venue}`,
    time: 'New',
    read: false,
  };
}

function normalizeEvent(id, data = {}) {
  const startDate = toEventDate(data.startDate);
  const endDate = toEventDate(data.endDate) || startDate;
  const status = String(data.status || 'upcoming').toLowerCase();
  const title = cleanText(data.title) || 'Untitled Event';
  const venue = cleanText(data.location || data.venue) || 'Naga City';
  const date = formatEventDateRange(startDate, endDate);
  const time = formatEventTimeRange(data.startTime, data.endTime);

  return {
    id,
    title,
    what: title,
    description: cleanText(data.description),
    venue,
    where: venue,
    location: venue,
    locationLat: toNumber(data.locationLat),
    locationLng: toNumber(data.locationLng),
    locationCategory: data.locationCategory || null,
    category: data.category || 'other',
    status,
    expectedAttendance: Number(data.expectedAttendance || 0),
    actualAttendance: typeof data.actualAttendance === 'number' ? data.actualAttendance : null,
    startDate,
    endDate,
    createdAt: toEventDate(data.createdAt)?.getTime() || 0,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    date,
    time,
    when: time ? `${date}, ${time}` : date,
    encodedBy: data.encodedBy || null,
    image: getBackendImage(data, getPlaceImage({ name: title, category: data.category || 'Events' })),
    imageUrls: getBackendImages(data),
    sortTime: startDate ? startDate.getTime() : Number.MAX_SAFE_INTEGER,
  };
}

function isPublishedUpcoming(event) {
  if (!ACTIVE_STATUSES.has(event.status)) {
    return false;
  }

  if (!event.endDate) {
    return true;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return event.endDate >= startOfToday;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
