export function manilaDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value));
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type).value).join('-');
}

export function parseTravelDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function formatTravelDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addTravelDays(value, amount) {
  const date = parseTravelDate(value);
  if (!date) return '';
  date.setDate(date.getDate() + amount);
  return formatTravelDate(date);
}

export function parseVisitMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(String(value || '').trim());
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || (match[3] ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return hour * 60 + minute;
}

export function visitTimeFields(value) {
  const minutes = typeof value === 'number' ? value : parseVisitMinutes(value);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= 1440) return null;
  const hour = Math.floor(minutes / 60);
  const minute = String(minutes % 60).padStart(2, '0');
  return {
    visitTime: `${String(hour).padStart(2, '0')}:${minute}`,
    displayTime: `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`,
  };
}
