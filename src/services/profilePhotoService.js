import { auth } from './firebaseApp';
import { saveTravelerProfile } from './authService';
import { validatePhotoMetadata } from '../utils/profilePhotoValidation';

// Firestore documents have a 1 MiB limit. Keep both photos small enough to
// coexist with the rest of the traveler record without Firebase Storage.
const MAX_ENCODED_PHOTO_LENGTH = 250000;

export function encodeProfilePhoto(asset) {
  validatePhotoMetadata(asset);
  const encoded = String(asset.base64 || '').replace(/\s/g, '');
  if (!encoded) throw new Error('The selected photo could not be prepared. Please choose it again.');
  if (encoded.length > MAX_ENCODED_PHOTO_LENGTH) {
    throw new Error('This photo is too large for your profile. Please choose a smaller photo.');
  }
  const contentType = encoded.startsWith('/9j/') ? 'image/jpeg'
    : encoded.startsWith('iVBORw0KGgo') ? 'image/png' : null;
  if (!contentType || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error('Please choose a valid JPG or PNG photo.');
  }
  return `data:${contentType};base64,${encoded}`;
}

export async function saveProfileEdits(userId, profile, photoAssets = {}) {
  if (!userId || auth.currentUser?.uid !== userId || auth.currentUser.isAnonymous) {
    throw new Error('Please log in to save your profile.');
  }
  const photos = Object.entries(photoAssets);
  for (const [field] of photos) {
    if (!['image', 'coverImage'].includes(field)) throw new Error('Invalid photo type.');
  }
  const encodedPhotos = Object.fromEntries(photos.map(([field, asset]) => [field, encodeProfilePhoto(asset)]));
  if (auth.currentUser?.uid !== userId) throw new Error('Your session changed. Please log in again.');
  // One Firestore update saves text and both photos. Existing photo URLs stay
  // untouched when no replacement was selected.
  return saveTravelerProfile(userId, { ...profile, ...encodedPhotos });
}
