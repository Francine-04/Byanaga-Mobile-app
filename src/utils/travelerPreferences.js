export function emptyPreferences() {
  return { places: [], activities: [], travelStyle: '', budget: '', duration: '' };
}

export function normalizePreferences(preferences = {}) {
  preferences = preferences && typeof preferences === 'object' ? preferences : {};
  const list = (value) => Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean))] : [];
  return {
    places: list(preferences.places), activities: list(preferences.activities),
    travelStyle: preferences.travelStyle || '', budget: preferences.budget || '', duration: preferences.duration || '',
  };
}
