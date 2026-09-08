import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebaseApp';
import { saveTravelerProfile } from './authService';
import { detectPhotoContentType, validatePhotoMetadata } from '../utils/profilePhotoValidation';

export async function uploadProfilePhoto(userId, field, asset) {
  if (!userId || auth.currentUser?.uid !== userId || auth.currentUser.isAnonymous) {
    throw new Error('Please log in to change your photos.');
  }
  if (!['image', 'coverImage'].includes(field)) throw new Error('Invalid photo type.');
  validatePhotoMetadata(asset);
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  try {
    if (blob.size > 8 * 1024 * 1024) throw new Error('Please choose a photo smaller than 8 MB.');
    const header = blob.slice(0, 8);
    const buffer = typeof header.arrayBuffer === 'function' ? await header.arrayBuffer() : await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read your photo. Please choose it again.'));
      reader.readAsArrayBuffer(header);
    });
    const contentType = detectPhotoContentType(new Uint8Array(buffer));
    const extension = contentType === 'image/png' ? 'png' : 'jpg';
    const target = storageRef(storage, `users/${userId}/photos/${field}-${Date.now()}.${extension}`);
    await uploadBytes(target, blob, { contentType });
    const url = await getDownloadURL(target);
    if (auth.currentUser?.uid !== userId) throw new Error('Your session changed. Please log in again.');
    return url;
  } finally {
    blob.close?.();
  }
}

export async function saveProfileEdits(userId, profile, photoAssets = {}) {
  if (!userId || auth.currentUser?.uid !== userId || auth.currentUser.isAnonymous) {
    throw new Error('Please log in to save your profile.');
  }
  const photos = Object.entries(photoAssets);
  for (const [field, asset] of photos) {
    if (!['image', 'coverImage'].includes(field)) throw new Error('Invalid photo type.');
    validatePhotoMetadata(asset);
  }
  // Finish every upload before allowing a retry, then publish all edits together.
  const results = await Promise.allSettled(photos.map(async ([field, asset]) => (
    [field, await uploadProfilePhoto(userId, field, asset)]
  )));
  const failed = results.find((result) => result.status === 'rejected');
  if (failed) throw failed.reason;
  const uploadedPhotos = Object.fromEntries(results.map((result) => result.value));
  const savedProfile = await saveTravelerProfile(userId, { ...profile, ...uploadedPhotos });
  if (auth.currentUser?.uid !== userId) throw new Error('Your session changed. Please log in again.');
  return savedProfile;
}
