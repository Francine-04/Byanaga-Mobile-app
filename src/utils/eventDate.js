const MANILA_TIME_ZONE = 'Asia/Manila';
const DAY_MS = 24 * 60 * 60 * 1000;

export function toEventDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === 'function') return toEventDate(value.toDate());
  if (typeof value.seconds === 'number') return toEventDate(new Date(value.seconds * 1000));
  if (typeof value === 'number' || typeof value === 'string') return toEventDate(new Date(value));
  return null;
}

export function formatEventDateRange(startValue, endValue) {
  const startDate = toEventDate(startValue);
  const endDate = toEventDate(endValue) || startDate;
  if (!startDate) return 'Date to be announced';

  const formatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: MANILA_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (!endDate || manilaCalendarDay(startDate) === manilaCalendarDay(endDate)) {
    return formatter.format(startDate);
  }

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

export function formatEventTimeRange(startTime, endTime) {
  const start = formatClock(startTime);
  const end = formatClock(endTime);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return `Until ${end}`;
  return '';
}

export function isEventInCurrentWeek(event, now = new Date()) {
  const currentDay = manilaCalendarDay(now);
  const eventStart = manilaCalendarDay(event?.startDate || event?.endDate);
  const eventEnd = manilaCalendarDay(event?.endDate || event?.startDate);
  if (currentDay === null || eventStart === null || eventEnd === null) return false;

  const weekday = new Date(currentDay).getUTCDay();
  const mondayOffset = (weekday + 6) % 7;
  const weekStart = currentDay - mondayOffset * DAY_MS;
  const weekEnd = weekStart + 6 * DAY_MS;

  return eventStart <= weekEnd && eventEnd >= weekStart;
}

function manilaCalendarDay(value) {
  const date = toEventDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => Number(parts.find((item) => item.type === type)?.value);
  return Date.UTC(part('year'), part('month') - 1, part('day'));
}

function formatClock(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return '';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}
