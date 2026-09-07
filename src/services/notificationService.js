import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { onValue, ref, update, serverTimestamp } from 'firebase/database';
import { isVoucherAvailable, normalizeVoucher } from '../utils/establishmentContent';
import { auth, db, realtimeDb } from './firebaseApp';

export function subscribeToVouchers(onData, onError) {
  let seen = null;
  const published = new Map();
  return onSnapshot(query(collection(db, 'vouchers'), where('status', '==', 'approved')),
    (snapshot) => {
      const now = Date.now();
      const items = snapshot.docs
        .map((doc) => {
          if (seen && !seen.has(doc.id)) published.set(doc.id, now);
          return { ...normalizeVoucher(doc.id, doc.data()), publishedAt: published.get(doc.id) };
        })
        .filter((voucher) => isVoucherAvailable(voucher, now))
        .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
      seen = new Set(snapshot.docs.map((doc) => doc.id));
      onData(items);
    }, onError);
}
export function subscribeToPersonalNotices(userId, onData, onError) {
  return onSnapshot(query(collection(db, 'notifications'), where('userId', '==', userId)),
    (snapshot) => onData(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))), onError);
}
export function subscribeToNotificationReads(userId, onData, onError) {
  return onValue(ref(realtimeDb, `users/${userId}/notificationReads`), (snapshot) => onData(snapshot.val() || {}), onError);
}
export function notificationKey(id) {
  return encodeURIComponent(id).replace(/\./g, '%2E');
}
export async function saveNotificationReads(userId, ids) {
  if (auth.currentUser?.uid !== userId || auth.currentUser.isAnonymous) throw new Error('Please log in again.');
  if (!ids.length) return;
  await update(ref(realtimeDb, `users/${userId}/notificationReads`), Object.fromEntries(ids.map((id) => [notificationKey(id), serverTimestamp()])));
}
