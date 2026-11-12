import { suppliedPlacePhotos } from '../data/suppliedPlacePhotos';
import { placeImages } from '../data/placeImages';

export function normalizePhotoName(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&|\+/g, 'and').replace(/[^a-z0-9]/g, '');
}

const byName = new Map();
for (const photo of suppliedPlacePhotos) {
  if (photo.pending || photo.category === 'Food') continue;
  for (const alias of photo.aliases) {
    const key = normalizePhotoName(alias);
    const matches = byName.get(key) || [];
    if (!matches.includes(photo)) matches.push(photo);
    byName.set(key, matches);
  }
}

export function getSuppliedPlacePhotos(place = {}) {
  return byName.get(normalizePhotoName(place.name)) || [];
}

// Presentation-only: never delete source records or saved visits.
const hiddenPlaceNames = new Set([
  'Camarines Sur National High School', 'Cararayan', 'CBD II Bus Terminal',
  'Concepcion Grande', 'Dayangdang',
].map(normalizePhotoName));

export function isVisiblePlace(place) {
  return Boolean(place) && !hiddenPlaceNames.has(normalizePhotoName(place.name));
}

export function placesWithImages(places = []) {
  return places.filter(isVisiblePlace).map(withSuppliedPlaceImages)
    .filter((place) => Boolean(place?.image) && !isFestivalPlaceholder(place.image));
}

function isFestivalPlaceholder(image) {
  if (image === placeImages.festival) return true;
  const uri = typeof image === 'string' ? image : image?.uri;
  return typeof uri === 'string' && /dashboard-festival\.|category-festival|weekend-promo/i.test(uri);
}

// Applied after catalog merging so both cached API and Firebase records receive
// the same photos, without changing IDs, coordinates, ratings or visit data.
export function withSuppliedPlaceImages(place) {
  if (!place) return place;
  const matches = getSuppliedPlacePhotos(place);
  if (!matches.length) return place;
  const photos = matches.map((photo) => ({
    id: photo.id, image: photo.image, category: 'Place', caption: place.name,
  }));
  const suppliedIds = new Set(photos.map((photo) => photo.id));
  return {
    ...place,
    image: matches.every((photo) => photo.fallbackOnly) && place.image && !isFestivalPlaceholder(place.image)
      ? place.image : photos[0].image,
    photos: [...photos, ...(place.photos || []).filter((photo) => !suppliedIds.has(photo.id))],
    gallery: [
      ...photos.map((photo) => ({ ...photo, imageUrl: photo.image })),
      ...(place.gallery || []).filter((photo) => !suppliedIds.has(photo.id)),
    ],
  };
}

export const suppliedFoodPhotos = suppliedPlacePhotos.filter((photo) => photo.category === 'Food');

// The collection keeps every supplied photo accessible, including photos whose
// destination is not in the API catalog. It does not create map destinations.
export const suppliedPhotoCollection = suppliedPlacePhotos.map((photo) => ({
  id: photo.id, image: photo.image, category: photo.category,
  caption: photo.pending ? `${photo.name} (full name to confirm)` : (photo.aliases[1] || photo.name),
}));
