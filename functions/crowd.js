const TTL = 48 * 60 * 60 * 1000;
function recordVisit(state, uid, checkin) {
  if (!state || !checkin || !Number.isFinite(checkin.updatedAt) || !state.places?.[checkin.placeId]?.enabled) return state;
  // One historical visit per tourist/place/Manila calendar day; renewals do not inflate it.
  const day = new Date(checkin.updatedAt + 8 * 3600000).toISOString().slice(0, 10);
  state.history ||= {};
  state.history[uid] ||= {};
  state.history[uid][day] ||= {};
  if (!state.history[uid][day][checkin.placeId]) {
    state.history[uid][day][checkin.placeId] = { visitedAt: checkin.updatedAt };
    state.visitTotals ||= {};
    state.visitTotals[checkin.placeId] = (state.visitTotals[checkin.placeId] || 0) + 1;
  }
  return state;
}
function aggregateCrowd(state, now) {
  if (!state) return state;
  const counts = {};
  for (const [uid, userCheckins] of Object.entries(state.checkins || {})) {
    const legacy = typeof userCheckins.placeId === 'string';
    const entries = legacy ? [[userCheckins.placeId, userCheckins]] : Object.entries(userCheckins);
    for (const [placeId, checkin] of entries) {
    if (checkin.updatedAt <= now) recordVisit(state, uid, checkin);
    if (!Number.isFinite(checkin.updatedAt) || checkin.updatedAt > now || now - checkin.updatedAt >= TTL) {
      if (legacy) delete state.checkins[uid];
      else delete state.checkins[uid][placeId];
      continue;
    }
    if (state.places?.[checkin.placeId]?.enabled) counts[checkin.placeId] = (counts[checkin.placeId] || 0) + 1;
    }
  }
  const places = {};
  for (const [id, config] of Object.entries(state.places || {})) {
    if (!config.enabled) continue;
    const count = counts[id] || 0;
    const capacity = Number(config.capacity);
    const ratio = capacity > 0 && Number.isFinite(capacity) ? count / capacity : null;
    places[id] = { count, historicalVisits: state.visitTotals?.[id] || 0, capacity: ratio === null ? null : capacity,
      level: ratio === null ? null : ratio < .25 ? 'low' : ratio < .5 ? 'moderate' : ratio < .75 ? 'busy' : 'crowded' };
  }
  state.public = { updatedAt: now, places };
  return state;
}
module.exports = { aggregateCrowd, recordVisit, TTL };
