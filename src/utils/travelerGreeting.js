export function getFirstName(profile) {
  const saved = String(profile?.firstName || '').trim();
  return saved || String(profile?.name || '').trim().split(/\s+/).filter(Boolean)[0] || 'Traveler';
}

export function getManilaHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Manila' }).format(date));
}

export function getTimeGreeting(date = new Date()) {
  const hour = getManilaHour(date);
  if (hour < 12) return 'GOOD MORNING,';
  if (hour < 18) return 'GOOD AFTERNOON,';
  return 'GOOD EVENING,';
}
