export const photoFormatMessage = 'Please choose a JPG or PNG image only.';

export function validatePhotoMetadata(asset) {
  if (!asset?.uri) throw new Error('Please choose a photo.');
  const name = asset.fileName || asset.file?.name || '';
  const mime = String(asset.mimeType || asset.file?.type || '').toLowerCase();
  if (name && !/\.(jpe?g|png)$/i.test(name)) throw new Error(photoFormatMessage);
  if (mime && !['image/jpeg', 'image/jpg', 'image/png', 'application/octet-stream'].includes(mime)) throw new Error(photoFormatMessage);
}

export function detectPhotoContentType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((value, index) => bytes[index] === value)) return 'image/png';
  throw new Error(photoFormatMessage);
}
