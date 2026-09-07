import { getLegacyDashboardImage } from '../data/placeImages';

const IMAGE_FIELDS = [
  'image',
  'imageUrl',
  'imageURL',
  'photoUrl',
  'photoURL',
  'coverPhotoUrl',
  'profileImageUrl',
  'thumbnailUrl',
  'downloadURL',
  'downloadUrl',
];

const IMAGE_LIST_FIELDS = ['imageUrls', 'images', 'photos', 'gallery', 'media'];

export function getBackendImages(record = {}) {
  const images = [];

  IMAGE_FIELDS.forEach((field) => collectImageValue(record[field], images));
  IMAGE_LIST_FIELDS.forEach((field) => collectImageValue(record[field], images));

  return Array.from(new Set(images));
}

export function getBackendImage(record, fallback = null) {
  return getBackendImages(record)[0] || fallback;
}

function collectImageValue(value, images) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectImageValue(item, images));
    return;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    const legacyAsset = getLegacyDashboardImage(normalized);
    if (legacyAsset) images.push(legacyAsset);
    else if (isRenderableImageSource(normalized)) images.push(normalized);
    return;
  }

  if (typeof value === 'object') {
    ['url', 'uri', 'src', 'imageUrl', 'imageURL', 'downloadURL', 'downloadUrl'].forEach((field) => {
      collectImageValue(value[field], images);
    });
  }
}

function isRenderableImageSource(value) {
  return /^(https?:\/\/|data:image\/|blob:)/i.test(value);
}
