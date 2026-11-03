let sessionGranted = false;
export async function locationAccessStatus() {
  if (typeof navigator === 'undefined' || !navigator.geolocation || !globalThis.isSecureContext) return 'unavailable';
  try { return (await navigator.permissions.query({ name: 'geolocation' })).state; }
  catch { return sessionGranted ? 'granted' : 'prompt'; }
}
// Called only by the existing permission screen, in response to Allow Location.
export async function requestLocationAccess() {
  if (await locationAccessStatus() === 'unavailable') return 'unavailable';
  return new Promise((resolve) => navigator.geolocation.getCurrentPosition(() => { sessionGranted = true; resolve('granted'); }, (e) => { sessionGranted = false; resolve(e.code === 1 ? 'denied' : 'unavailable'); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }));
}
export async function watchLocation(onReading, onError) {
  if (await locationAccessStatus() !== 'granted') throw new Error('Location permission required.');
  let stopped = false, pending = false;
  const receive = (reading) => { if (!stopped) onReading(reading); };
  const fail = (error) => { if (error.code === 1) sessionGranted = false; if (!stopped) onError(error); };
  const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };
  const id = navigator.geolocation.watchPosition(receive, fail, options);
  // Browsers may emit watch updates only when moving. Request fresh fixes to
  // confirm stationary arrivals too; the detector ignores duplicate timestamps.
  const timer = setInterval(async () => {
    if (stopped || pending) return;
    pending = true;
    try {
      if (await locationAccessStatus() !== 'granted') { fail({ code: 1 }); pending = false; return; }
      if (stopped) return;
      navigator.geolocation.getCurrentPosition((reading) => { pending = false; receive(reading); }, (error) => { pending = false; fail(error); }, options);
    } catch { pending = false; fail({ code: 2 }); }
  }, 5000);
  return () => { stopped = true; sessionGranted = false; clearInterval(timer); navigator.geolocation.clearWatch(id); };
}
export async function watchPermission(onChange) {
  try { const status = await navigator.permissions.query({ name: 'geolocation' }); const listener = () => onChange(status.state); status.addEventListener('change', listener); return () => status.removeEventListener('change', listener); }
  catch { return () => {}; }
}
