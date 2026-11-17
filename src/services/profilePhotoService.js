import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebaseApp';
import { saveTravelerProfile } from './authService';
import { detectPhotoContentType, validatePhotoMetadata } from '../utils/profilePhotoValidation';

export async function uploadProfilePhoto(userId, field, asset) {
  console.log('📸 Starting profile photo upload:', { userId, field, assetUri: asset?.uri });
  
  if (!userId || auth.currentUser?.uid !== userId || auth.currentUser.isAnonymous) {
    throw new Error('Please log in to change your photos.');
  }
  if (!['image', 'coverImage'].includes(field)) throw new Error('Invalid photo type.');
  
  console.log('✓ User authenticated');
  
  validatePhotoMetadata(asset);
  console.log('✓ Photo metadata validated');
  
  console.log('📥 Fetching photo blob...');
  const response = await fetch(asset.uri);
  console.log('✓ Fetch response received:', response.status);
  
  const blob = await response.blob();
  console.log('✓ Blob created:', blob.size, 'bytes');
  
  try {
    if (blob.size > 8 * 1024 * 1024) throw new Error('Please choose a photo smaller than 8 MB.');
    
    console.log('🔍 Reading file header for content type detection...');
    const header = blob.slice(0, 8);
    const buffer = typeof header.arrayBuffer === 'function' ? await header.arrayBuffer() : await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read your photo. Please choose it again.'));
      reader.readAsArrayBuffer(header);
    });
    
    const contentType = detectPhotoContentType(new Uint8Array(buffer));
    console.log('✓ Content type detected:', contentType);
    
    const extension = contentType === 'image/png' ? 'png' : 'jpg';
    const target = storageRef(storage, `users/${userId}/photos/${field}-${Date.now()}.${extension}`);
    
    console.log('☁️  Uploading to Firebase Storage:', target.fullPath);
    await uploadBytes(target, blob, { contentType });
    console.log('✓ Upload complete!');
    
    console.log('🔗 Getting download URL...');
    const url = await getDownloadURL(target);
    console.log('✓ Download URL obtained:', url.substring(0, 50) + '...');
    
    if (auth.currentUser?.uid !== userId) throw new Error('Your session changed. Please log in again.');
    
    console.log('✅ Photo upload successful!');
    return url;
  } catch (error) {
    console.error('❌ Error during photo upload:', error);
    throw error;
  } finally {
    blob.close?.();
  }
}

export async function saveProfileEdits(userId, profile, photoAssets = {}) {
  console.log('💾 Starting profile save:', { userId, hasPhotos: Object.keys(photoAssets).length > 0 });
  
  if (!userId || auth.currentUser?.uid !== userId || auth.currentUser.isAnonymous) {
    throw new Error('Please log in to save your profile.');
  }
  
  const photos = Object.entries(photoAssets);
  for (const [field, asset] of photos) {
    if (!['image', 'coverImage'].includes(field)) throw new Error('Invalid photo type.');
    validatePhotoMetadata(asset);
  }
  
  console.log(`📤 Uploading ${photos.length} photo(s)...`);
  
  // Finish every upload before allowing a retry, then publish all edits together.
  const results = await Promise.allSettled(photos.map(async ([field, asset]) => {
    console.log(`Uploading ${field}...`);
    const url = await uploadProfilePhoto(userId, field, asset);
    return [field, url];
  }));
  
  const failed = results.find((result) => result.status === 'rejected');
  if (failed) {
    console.error('❌ Photo upload failed:', failed.reason);
    throw failed.reason;
  }
  
  const uploadedPhotos = Object.fromEntries(results.map((result) => result.value));
  console.log('✓ All photos uploaded successfully');
  
  console.log('💾 Saving profile to Firestore...');
  const savedProfile = await saveTravelerProfile(userId, { ...profile, ...uploadedPhotos });
  console.log('✅ Profile saved successfully!');
  
  if (auth.currentUser?.uid !== userId) throw new Error('Your session changed. Please log in again.');
  return savedProfile;
}
