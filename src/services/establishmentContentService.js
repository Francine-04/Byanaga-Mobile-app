import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  normalizeEstablishmentGalleryItem,
  normalizeEstablishmentMenuItem,
  normalizeEstablishmentPost,
} from '../utils/establishmentContent';
import { db } from './firebaseApp';

export function subscribeToEstablishmentPosts(onData, onError) {
  return subscribeToCollection(
    query(collection(db, 'establishment_posts'), where('status', '==', 'published')),
    normalizeEstablishmentPost,
    (item) => item.status === 'published' && Boolean(item.establishmentId),
    onData,
    onError
  );
}

export function subscribeToEstablishmentGallery(onData, onError) {
  return subscribeToCollection(
    collection(db, 'establishment_gallery'),
    normalizeEstablishmentGalleryItem,
    (item) => Boolean(item.establishmentId && item.imageUrl),
    onData,
    onError
  );
}

export function subscribeToEstablishmentMenu(onData, onError) {
  return subscribeToCollection(
    collection(db, 'establishment_menu_items'),
    normalizeEstablishmentMenuItem,
    (item) => item.isAvailable && Boolean(item.establishmentId),
    onData,
    onError
  );
}

function subscribeToCollection(source, normalize, isVisible, onData, onError) {
  return onSnapshot(
    source,
    (snapshot) => {
      const items = snapshot.docs
        .map((document) => normalize(document.id, document.data()))
        .filter(isVisible)
        .sort((a, b) => dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt));
      onData(items);
    },
    onError
  );
}

function dateValue(value) {
  return value instanceof Date ? value.getTime() : 0;
}
