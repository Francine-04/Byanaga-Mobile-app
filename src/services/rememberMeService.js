import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBERED_TRAVELER_KEY = 'byanaga.rememberedTraveler.v1';

export async function getRememberedTraveler() {
  const raw = await AsyncStorage.getItem(REMEMBERED_TRAVELER_KEY);
  if (!raw) return null;

  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return null;
    return {
      uid: typeof saved.uid === 'string' ? saved.uid : '',
      email: typeof saved.email === 'string' ? saved.email : '',
    };
  } catch {
    return null;
  }
}

export async function rememberTraveler({ uid, email }) {
  await AsyncStorage.setItem(REMEMBERED_TRAVELER_KEY, JSON.stringify({ uid, email }));
}

export async function clearRememberedTraveler() {
  await AsyncStorage.removeItem(REMEMBERED_TRAVELER_KEY);
}
