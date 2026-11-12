export const CHECKIN_TTL = 48 * 60 * 60 * 1000;
const DAY = 86400000;
const MANILA_OFFSET = 8 * 60 * 60 * 1000;

// Numeric Manila calendar day, also validated against Firebase's server clock.
export const visitDayKey = (now = Date.now()) => String(Math.floor((now + MANILA_OFFSET) / DAY));
export const isCheckinActive = (checkin, now = Date.now()) =>
  Number.isFinite(checkin?.updatedAt) && checkin.updatedAt <= now && now - checkin.updatedAt < CHECKIN_TTL;

// Input contains only day/place totals. Never download other tourists' records.
export function summarizeVisitDays(days = {}, now = Date.now()) {
  const today = Number(visitDayKey(now));
  const places = {};
  Object.entries(days).forEach(([day, counts]) => {
    if (!/^\d+$/.test(day) || Number(day) > today || !counts || typeof counts !== 'object') return;
    Object.entries(counts).forEach(([id, count]) => {
      if (!Number.isSafeInteger(count) || count <= 0) return;
      const place = places[id] || (places[id] = { historicalVisits: 0, recentVisits: 0 });
      place.historicalVisits += count;
      if (Number(day) >= today - 1) place.recentVisits += count;
    });
  });
  return places;
}
