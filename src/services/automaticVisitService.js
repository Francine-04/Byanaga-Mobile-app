import { get, increment, onValue, orderByKey, query, ref, serverTimestamp, set, startAt, endAt, update } from 'firebase/database';
import { auth, realtimeDb } from './firebaseApp';
import { visitDayKey } from '../utils/checkinActivity';

export const watchRecordingConsent = (uid, onData, onError) => onValue(ref(realtimeDb, `crowd/consents/${uid}`), (s) => onData(s.val()?.enabled === true && s.val()?.version === 1), onError);
export const watchAutoState = (uid, onData, onError) => onValue(ref(realtimeDb, `crowd/autoState/${uid}`), (s) => onData(s.val() || {}), onError);
export const watchActivityConfig = (onData, onError) => onValue(ref(realtimeDb, 'crowd/activityConfig'), (s) => onData(s.val()), onError);
export const watchAutomaticCounts = (from, to, onData, onError) => onValue(query(ref(realtimeDb, 'crowd/autoDays'), orderByKey(), startAt(from), endAt(to)), (s) => onData(s.val() || {}), onError);
function currentUser() {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Sign in to manage automatic visits.');
  return user.uid;
}
export function setRecordingConsent(enabled) {
  return set(ref(realtimeDb, `crowd/consents/${currentUser()}`), { enabled: !!enabled, version: 1, updatedAt: serverTimestamp() });
}
export async function saveAutoTransition(placeId, phase, expectedState, stillAllowed, observedAt) {
  const uid = currentUser();
  const statePath = `autoState/${uid}/${placeId}`;
  const previous = (await get(ref(realtimeDb, `crowd/${statePath}`))).val();
  if (previous?.phase === phase || (!previous && phase === 'outside')) return previous;
  if ((previous?.sequence || 0) !== (expectedState?.sequence || 0) || (previous?.phase || null) !== (expectedState?.phase || null)) return previous;
  const offset = await new Promise((resolve, reject) => onValue(ref(realtimeDb, '.info/serverTimeOffset'), (s) => resolve(s.val() || 0), reject, { onlyOnce: true }));
  if (!stillAllowed() || currentUser() !== uid) return previous;
  const day = phase === 'inside' ? Number(visitDayKey(Date.now() + offset)) : previous.eventDay;
  const sequence = phase === 'inside' ? (previous?.sequence || 0) + 1 : previous.sequence;
  const state = { phase, sequence, eventDay: day, updatedAt: serverTimestamp(), observedAt: observedAt + offset };
  const changes = { [statePath]: state };
  if (phase === 'inside') {
    changes[`autoVisits/${uid}/${placeId}/${sequence}`] = { visitorId: uid, destinationId: placeId, visitDay: day, timestamp: serverTimestamp() };
    changes[`autoDays/${day}/${placeId}`] = increment(1);
  }
  await update(ref(realtimeDb, 'crowd'), changes);
  return state;
}
