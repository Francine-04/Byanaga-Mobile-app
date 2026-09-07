import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { buildNotificationFeed } from '../utils/notificationFeed';
import { notificationKey, saveNotificationReads, subscribeToNotificationReads, subscribeToPersonalNotices, subscribeToVouchers } from '../services/notificationService';

export default function useNotificationFeed({ userId, events, trips, zones, establishmentPosts = [] }) {
  const [vouchers, setVouchers] = useState([]);
  const [direct, setDirect] = useState([]);
  const [reads, setReads] = useState({});
  const [errors, setErrors] = useState({});
  const [now, setNow] = useState(Date.now);
  const heatVersions = useRef(new Map());
  const [heatTimes, setHeatTimes] = useState({});
  useEffect(() => {
    const changes = {};
    zones.forEach((zone) => {
      const version = `${zone.colorKey}-${zone.count}`;
      const previous = heatVersions.current.get(zone.id);
      if (previous && previous !== version) changes[`heat-${zone.id}-${version}`] = Date.now();
      heatVersions.current.set(zone.id, version);
    });
    if (Object.keys(changes).length) setHeatTimes((current) => ({ ...current, ...changes }));
  }, [zones]);
  const error = useCallback((key, cause) => setErrors((current) => ({ ...current, [key]: cause?.message || '' })), []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') setNow(Date.now()); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  useEffect(() => subscribeToVouchers((data) => { setVouchers(data); error('offers', null); }, (cause) => { setVouchers([]); error('offers', cause); }), [error]);
  useEffect(() => {
    let active = true;
    setDirect([]);
    setReads({});
    error('personal', null);
    error('reads', null);
    if (!userId) return undefined;
    const subscriptions = [
      subscribeToPersonalNotices(userId, (data) => { if (active) { setDirect(data); error('personal', null); } }, (cause) => { if (active) error('personal', cause); }),
      subscribeToNotificationReads(userId, (data) => { if (active) { setReads(data); error('reads', null); } }, (cause) => { if (active) error('reads', cause); }),
    ];
    return () => { active = false; subscriptions.forEach((unsubscribe) => unsubscribe()); };
  }, [userId, error]);
  const notifications = useMemo(() => buildNotificationFeed({ events, vouchers, establishmentPosts, direct, trips, zones, now }).map((item) => ({
    ...item, createdAt: heatTimes[item.id] || item.createdAt, read: Boolean(reads[notificationKey(item.id)]),
    time: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }) : 'Latest',
  })), [events, vouchers, establishmentPosts, direct, trips, zones, now, reads, heatTimes]);
  const markNotificationsRead = useCallback(async (ids) => {
    try {
      if (userId) await saveNotificationReads(userId, ids);
      setReads((current) => ({ ...current, ...Object.fromEntries(ids.map((id) => [notificationKey(id), true])) }));
      error('save', null);
    } catch (cause) { error('save', cause); }
  }, [userId, error]);
  const markAllNotificationsRead = useCallback(() => markNotificationsRead(notifications.map((item) => item.id)), [notifications, markNotificationsRead]);
  return {
    notifications,
    vouchers,
    markAllNotificationsRead,
    markNotificationsRead,
    notificationError: Object.values(errors).filter(Boolean).join('\n'),
  };
}
