import { collection, onSnapshot } from 'firebase/firestore';
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
  const startDate = parseFirestoreDate(data.startDate);
  const endDate = parseFirestoreDate(data.endDate) || startDate;
  const status = String(data.status || 'upcoming').toLowerCase();

  return {
    id,
    title: data.title || 'Untitled Event',
    description: data.description || '',
    venue: data.location || 'Naga City',
    location: data.location || 'Naga City',
    locationLat: toNumber(data.locationLat),
    locationLng: toNumber(data.locationLng),
    locationCategory: data.locationCategory || null,
    category: data.category || 'other',
    status,
    expectedAttendance: Number(data.expectedAttendance || 0),
    actualAttendance: typeof data.actualAttendance === 'number' ? data.actualAttendance : null,
    startDate,
    endDate,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    date: formatDateRange(startDate, endDate),
    image: null,
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

function parseFirestoreDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatDateRange(startDate, endDate) {
  if (!startDate) {
    return 'Date to be announced';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (!endDate || isSameDay(startDate, endDate)) {
    return formatter.format(startDate);
  }

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function isSameDay(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}
