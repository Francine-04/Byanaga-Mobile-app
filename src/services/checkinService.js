import { get, increment, onValue, ref, remove, serverTimestamp, update } from 'firebase/database';
import { auth, realtimeDb } from './firebaseApp';
import { visitDayKey } from '../utils/checkinActivity';

export const crowdPlaceKey = (place) => encodeURIComponent(String(place.dashboardId || place.id)).replace(/\./g, '%2E');
export const watchCrowd = (onData, onError) => onValue(ref(realtimeDb, 'crowd/public/days'), (s) => onData(s.val() || {}), onError);
export const watchCrowdPlaces = (onData, onError) => onValue(ref(realtimeDb, 'crowd/places'), (s) => onData(s.val() || {}), onError);
export const watchMyCheckin = (uid, onData, onError) => onValue(ref(realtimeDb, `crowd/checkins/${uid}`), (s) => onData(s.val()), onError);
export const watchMyVisitHistory = (uid, onData, onError) => onValue(ref(realtimeDb, `crowd/history/${uid}`), (s) => onData(s.val() || {}), onError);
export const watchServerOffset = (onData) => onValue(ref(realtimeDb, '.info/serverTimeOffset'), (s) => onData(s.val() || 0));
const readServerOffset = () => new Promise((resolve, reject) => {
  // .info is SDK-local metadata; get() may send an invalid server path on cold start.
  onValue(ref(realtimeDb, '.info/serverTimeOffset'), (s) => resolve(s.val() || 0), reject, { onlyOnce: true });
});
function userId() {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Log in to check in.');
  return user.uid;
}
export async function checkIn(place) {
  const uid = userId();
  const id = crowdPlaceKey(place);
  // A retry handles simultaneous tabs/check-ins and crossing midnight during a write.
  // The server rules, not this read, enforce deduplication and count integrity.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const offset = await readServerOffset();
    const day = visitDayKey(Date.now() + offset);
    const historyPath = `history/${uid}/${day}/${id}`;
    const saved = await get(ref(realtimeDb, `crowd/${historyPath}`));
    const updates = { [`checkins/${uid}/${id}`]: { placeId: id, updatedAt: serverTimestamp() } };
    if (!saved.exists()) {
      updates[historyPath] = { visitedAt: serverTimestamp() };
      updates[`public/days/${day}/${id}`] = increment(1);
    }
    try {
      await update(ref(realtimeDb, 'crowd'), updates);
      return;
    } catch (error) {
      if (attempt || !String(error.code).toLowerCase().includes('permission')) throw error;
    }
  }
}
export const checkOut = (place) => remove(ref(realtimeDb, `crowd/checkins/${userId()}/${crowdPlaceKey(place)}`));
