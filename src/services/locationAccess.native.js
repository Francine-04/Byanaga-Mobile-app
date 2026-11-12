// Old development builds may not contain the new native module yet. Keep the
// rest of the app usable and route to existing permission handling in that case.
let Location;
try { Location = require('expo-location'); } catch { Location = null; }
export async function locationAccessStatus() {
  if (!Location) return 'unavailable';
  const result = await Location.getForegroundPermissionsAsync();
  return result.granted && await Location.hasServicesEnabledAsync() ? 'granted' : result.status === 'denied' ? 'denied' : 'prompt';
}
export async function requestLocationAccess() {
  if (!Location) return 'unavailable';
  const result = await Location.requestForegroundPermissionsAsync();
  return result.granted && await Location.hasServicesEnabledAsync() ? 'granted' : 'denied';
}
export async function watchLocation(onReading, onError) {
  if (await locationAccessStatus() !== 'granted') throw new Error('Location permission required.');
  const subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 0 }, onReading, onError);
  return () => subscription.remove();
}
export async function watchPermission() { return () => {}; }
