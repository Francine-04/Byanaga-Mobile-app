export const durationOptions = ['Half Day', 'One Day', 'Weekend',
  ...Array.from({ length: 29 }, (_, index) => `${index + 2} Days`),
  '1 Week', '2 Weeks', '3 Weeks', '4 Weeks'];

export function tripDayCount(duration) {
  if (!duration || duration === 'Half Day' || duration === 'One Day') return 1;
  if (duration === 'Weekend') return 2;
  const match = /^(\d+)\s+(days?|weeks?)$/i.exec(String(duration).trim());
  const days = match ? Number(match[1]) * (/week/i.test(match[2]) ? 7 : 1) : NaN;
  if (!Number.isInteger(days) || days < 1 || days > 30) throw new Error('Choose a trip duration from 1 to 30 days.');
  return days;
}
