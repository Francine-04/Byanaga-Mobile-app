import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { watchCrowdPlaces } from '../services/checkinService';
import { watchAutoState, watchRecordingConsent, saveAutoTransition } from '../services/automaticVisitService';
import { locationAccessStatus, watchLocation, watchPermission } from '../services/locationAccess';
import { createVisitDetector, registeredPlaces } from '../utils/automaticVisits';

export default function useAutomaticVisits({ user, ready, locationPermission, offline, guest }) {
  const [consent, setConsent] = useState(false);
  const [configs, setConfigs] = useState({});
  const [statesReady, setStatesReady] = useState(false);
  const [stateOwner, setStateOwner] = useState(null);
  const [locallyPaused, setLocallyPaused] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('off');
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [permissionTick, setPermissionTick] = useState(0);
  const states = useRef({});
  const eligibility = useRef(false);
  const places = useMemo(() => registeredPlaces(configs), [configs]);
  const eligible = !!user && stateOwner === user.uid && !user.isAnonymous && !guest && ready && consent && !locallyPaused && locationPermission === 'allowed' && !offline && foreground && statesReady;
  eligibility.current = eligible;

  useEffect(() => {
    const updateActive = () => {
      const active = AppState.currentState === 'active' && (Platform.OS !== 'web' || document.visibilityState === 'visible');
      if (!active) eligibility.current = false;
      setForeground(active);
    };
    const sub = AppState.addEventListener('change', updateActive);
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', updateActive);
    updateActive();
    return () => { sub.remove(); if (Platform.OS === 'web') document.removeEventListener('visibilitychange', updateActive); };
  }, []);
  useEffect(() => {
    setConsent(false); setStatesReady(false); setStateOwner(null); setError(''); states.current = {};
    if (!user || user.isAnonymous || guest) return undefined;
    const stops = [
      watchRecordingConsent(user.uid, setConsent, () => { setConsent(false); setError('Automatic visit consent could not load.'); }),
      watchAutoState(user.uid, (value) => { states.current = value; setStateOwner(user.uid); setStatesReady(true); }, () => { setStatesReady(false); setError('Visit recording could not connect.'); }),
    ];
    return () => stops.forEach((stop) => stop());
  }, [user?.uid, user?.isAnonymous, guest]);
  useEffect(() => watchCrowdPlaces(setConfigs, () => { setConfigs({}); setError('Registered destination settings could not load.'); }), []);

  useEffect(() => {
    if (!eligible || !places.length) { setStatus(!consent || locallyPaused ? 'off' : !foreground ? 'paused' : offline ? 'offline' : !places.length ? 'no-places' : 'waiting'); return undefined; }
    let cancelled = false, busy = false, stopGps = () => {}, stopPermissions = () => {};
    const detector = createVisitDetector(places);
    const allowed = () => !cancelled && eligibility.current;
    const halt = (nextStatus) => { cancelled = true; stopGps(); detector.reset(); setStatus(nextStatus); };
    const permissionCheck = async () => {
      try { const permission = await locationAccessStatus(); if (!cancelled && permission !== 'granted') halt('permission-required'); }
      catch { if (!cancelled) halt('permission-required'); }
    };
    const start = async () => {
      if (await locationAccessStatus() !== 'granted') { if (!cancelled) setStatus('permission-required'); return; }
      if (!allowed()) return;
      const unwatch = await watchPermission((value) => { if (value !== 'granted' && !cancelled) halt('permission-required'); });
      if (cancelled) { unwatch(); return; } stopPermissions = unwatch;
      const unsubscribe = await watchLocation(async (reading) => {
        if (!allowed() || busy) return;
        busy = true;
        try {
          if (await locationAccessStatus() !== 'granted') { if (!cancelled) halt('permission-required'); return; }
          if (!allowed()) return;
          const events = detector.sample(reading, states.current);
          for (const event of events) {
            if (!allowed()) break;
            const result = await saveAutoTransition(event.placeId, event.phase, states.current[event.placeId], allowed, reading.timestamp);
            if (result && allowed()) states.current = { ...states.current, [event.placeId]: result };
          }
          if (allowed()) { setError(''); setStatus(reading.coords?.accuracy > 25 ? 'accuracy' : 'tracking'); }
        } catch { detector.reset(); if (allowed()) setError('A visit could not be saved. Recording will retry with fresh GPS readings.'); }
        finally { busy = false; }
      }, (cause) => { if (!cancelled) { detector.reset(); if (cause?.code === 1) halt('permission-required'); else setStatus('gps-unavailable'); } });
      if (cancelled) unsubscribe(); else { stopGps = unsubscribe; setStatus('tracking'); }
    };
    start().catch(() => { if (!cancelled) halt('permission-required'); });
    const timer = setInterval(permissionCheck, 10000);
    return () => { cancelled = true; clearInterval(timer); stopGps(); stopPermissions(); detector.reset(); };
  }, [eligible, places, permissionTick, user?.uid, consent, locallyPaused, foreground, offline]);
  return { consent: consent && !locallyPaused && stateOwner === user?.uid, status, error, places,
    pauseRecording: () => { eligibility.current = false; setLocallyPaused(true); },
    retryPermission: () => { setLocallyPaused(false); setPermissionTick((value) => value + 1); } };
}
