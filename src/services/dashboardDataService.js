import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { findKnownPlace } from '../data/nagaPlaces';
import { getPlaceImage } from '../data/placeImages';
import { getBackendImage, getBackendImages } from '../utils/backendImages';
import { db } from './firebaseApp';

export function subscribeToDashboardDestinations(onDestinations, onError) {
  return onSnapshot(
    query(collection(db, 'destinations'), where('isActive', '==', true)),
    (snapshot) => {
      const destinations = snapshot.docs
        .map((doc) => normalizeDestination(doc.id, doc.data()))
        .filter((destination) => destination.isActive)
        .sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0) || a.name.localeCompare(b.name));

      onDestinations(destinations);
    },
    onError
  );
}

export function subscribeToDashboardAccommodations(onAccommodations, onError) {
  return onSnapshot(
    query(collection(db, 'accommodations'), where('isActive', '==', true)),
    (snapshot) => {
      const accommodations = snapshot.docs
        .map((doc) => normalizeAccommodation(doc.id, doc.data()))
        .filter((accommodation) => accommodation.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));

      onAccommodations(accommodations);
    },
    onError
  );
}

export function subscribeToDashboardBusinessProfiles(onProfiles, onError) {
  return onSnapshot(
    query(collection(db, 'business_profiles'), where('status', '==', 'approved')),
    (snapshot) => {
      const profiles = snapshot.docs
        .map((doc) => normalizeBusinessProfile(doc.id, doc.data()))
        .filter((profile) => profile.status === 'approved')
        .sort((a, b) => a.name.localeCompare(b.name));

      onProfiles(profiles);
    },
    onError
  );
}

export function subscribeToDashboardVisitors(onVisitors, onError) {
  return onSnapshot(
    collection(db, 'visitors'),
    (snapshot) => {
      const visitors = snapshot.docs
        .map((doc) => normalizeVisitor(doc.id, doc.data()))
        .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));

      onVisitors(visitors);
    },
    onError
  );
}

export function businessProfileToRestaurant(profile) {
  const knownPlace = findKnownPlace(profile.name) || findKnownPlace(profile.address);

  return {
    id: profile.id,
    dashboardId: profile.dashboardId,
    name: profile.name,
    cuisine: profile.services[0] || 'Local',
    image: profile.image || getPlaceImage({ name: profile.name, category: 'Food' }),
    rating: 4.5,
    distance: 'Naga City',
    priceRange: profile.priceRange || 'Rate TBD',
    address: profile.address,
    contact: profile.contact,
    isOpen: profile.isOpen,
    latitude: profile.latitude ?? knownPlace?.latitude,
    longitude: profile.longitude ?? knownPlace?.longitude,
    source: 'dashboard',
  };
}

export function businessProfileToAccommodation(profile) {
  const knownPlace = findKnownPlace(profile.name) || findKnownPlace(profile.address);

  return {
    id: profile.id,
    dashboardId: profile.dashboardId,
    name: profile.name,
    amenities: profile.amenities.length ? profile.amenities.slice(0, 3).join(', ') : profile.categoryLabel,
    image: profile.image || getPlaceImage({ name: profile.name, category: 'Accommodation' }),
    rating: 4.5,
    distance: 'Naga City',
    price: profile.priceRange || 'Rate TBD',
    type: profile.category,
    typeLabel: profile.categoryLabel,
    address: profile.address,
    contact: profile.contact,
    isOpen: profile.isOpen,
    latitude: profile.latitude ?? knownPlace?.latitude,
    longitude: profile.longitude ?? knownPlace?.longitude,
    source: 'dashboard',
  };
}

export function businessProfileToDestination(profile) {
  const knownPlace = findKnownPlace(profile.name) || findKnownPlace(profile.address);
  const latitude = profile.latitude ?? knownPlace?.latitude;
  const longitude = profile.longitude ?? knownPlace?.longitude;

  return {
    id: profile.id,
    dashboardId: profile.dashboardId,
    name: profile.name,
    category: businessCategoryToDestinationCategory(profile.category),
    image: profile.image || getPlaceImage({ name: profile.name, category: profile.category }),
    rating: 4.5,
    distance: formatDistanceFromCenter(latitude, longitude),
    estimatedVisitTime: 'Suggested stop',
    crowdLevel: 'Moderate',
    description: profile.description || 'Approved tourism business profile from the dashboard.',
    openingHours: formatOperatingHours(profile.operatingHours),
    entranceFee: profile.priceRange || 'Not provided',
    contact: profile.contact || 'Not connected',
    weather: 'Naga City weather',
    bestTime: 'Plan ahead',
    tags: [profile.categoryLabel, ...profile.services].filter(Boolean).slice(0, 4),
    latitude,
    longitude,
    photos: imageGallery(profile.imageUrls, profile.image),
    source: 'dashboard',
  };
}

function normalizeDestination(id, data = {}) {
  const knownPlace = findKnownPlace(data.name) || findKnownPlace(id);
  const latitude = toNumber(data.latitude) ?? knownPlace?.latitude ?? null;
  const longitude = toNumber(data.longitude) ?? knownPlace?.longitude ?? null;
  const visitCount = Number(data.visitCount || 0);
  const rating = Number(data.averageRating || data.rating || 0);

  return {
    id: `dashboard-destination-${id}`,
    dashboardId: id,
    name: data.name || knownPlace?.name || 'Untitled Destination',
    category: destinationCategoryLabel(data.category || knownPlace?.category),
    image: getBackendImage(data, knownPlace?.image || getPlaceImage({ name: data.name || knownPlace?.name, category: data.category || knownPlace?.category })),
    imageUrls: getBackendImages(data),
    rating: rating > 0 ? Number(rating.toFixed(1)) : 4.5,
    distance: formatDistanceFromCenter(latitude, longitude),
    estimatedVisitTime: data.estimatedVisitTime || 'Suggested stop',
    crowdLevel: clusterToCrowdLevel(data.cluster, visitCount),
    description: data.description || 'Tourism destination from the dashboard.',
    openingHours: data.openingHours || 'Not provided',
    entranceFee: data.entranceFee || 'Not provided',
    contact: data.contactNumber || data.contact || 'Not connected',
    weather: 'Naga City weather',
    bestTime: data.bestTime || 'Plan ahead',
    tags: [destinationCategoryLabel(data.category || knownPlace?.category), data.clusterLabel].filter(Boolean),
    latitude,
    longitude,
    visitCount,
    ratingCount: Number(data.ratingCount || 0),
    isActive: data.isActive !== false,
    cluster: data.cluster || 'unrated',
    photos: imageGallery(getBackendImages(data), getBackendImage(data, knownPlace?.image || getPlaceImage({ name: data.name || knownPlace?.name, category: data.category || knownPlace?.category }))),
    source: 'dashboard',
  };
}

function normalizeAccommodation(id, data = {}) {
  const typeLabel = accommodationTypeLabel(data.type);
  const knownPlace = findKnownPlace(data.name) || findKnownPlace(id) || findKnownPlace(data.address);
  const latitude = toNumber(data.latitude ?? data.locationLat ?? data.lat) ?? knownPlace?.latitude ?? null;
  const longitude = toNumber(data.longitude ?? data.locationLng ?? data.lng) ?? knownPlace?.longitude ?? null;

  return {
    id: `dashboard-accommodation-${id}`,
    dashboardId: id,
    name: data.name || 'Untitled Stay',
    amenities: typeLabel,
    image: getBackendImage(data, knownPlace?.image || getPlaceImage({ name: data.name || knownPlace?.name, category: 'Accommodation' })),
    imageUrls: getBackendImages(data),
    rating: 4.5,
    distance: 'Naga City',
    price: data.priceRange || 'Rate TBD',
    type: data.type || 'other',
    typeLabel,
    address: data.address || 'Naga City',
    contact: data.contactNumber || 'Not connected',
    latitude,
    longitude,
    totalCapacity: Number(data.totalCapacity || 0),
    currentOccupancy: Number(data.currentOccupancy || 0),
    isActive: data.isActive !== false,
    source: 'dashboard',
  };
}

function normalizeBusinessProfile(id, data = {}) {
  const category = String(data.category || 'other').toLowerCase();
  const knownPlace = findKnownPlace(data.businessName || data.name) || findKnownPlace(data.address);
  const latitude = toNumber(data.latitude ?? data.locationLat ?? data.lat) ?? knownPlace?.latitude ?? null;
  const longitude = toNumber(data.longitude ?? data.locationLng ?? data.lng) ?? knownPlace?.longitude ?? null;

  return {
    id: `dashboard-business-${id}`,
    dashboardId: id,
    ownerId: data.ownerId || '',
    name: data.businessName || data.name || 'Untitled Business',
    description: data.description || '',
    category,
    categoryLabel: businessCategoryLabel(category),
    address: [data.address, data.city, data.province].filter(Boolean).join(', ') || 'Naga City',
    contact: data.contactNumber || data.phone || 'Not connected',
    email: data.email || '',
    website: data.website || '',
    amenities: toStringList(data.amenities),
    services: toStringList(data.services),
    operatingHours: Array.isArray(data.operatingHours) ? data.operatingHours : [],
    priceRange: formatPriceRange(data.priceRangeMin, data.priceRangeMax),
    status: String(data.status || 'draft').toLowerCase(),
    isOpen: data.isOpen !== false,
    latitude,
    longitude,
    image: getBackendImage(data, knownPlace?.image || getPlaceImage({ name: data.businessName || data.name, category })),
    imageUrls: getBackendImages(data),
    source: 'dashboard',
  };
}

function normalizeVisitor(id, data = {}) {
  return {
    id,
    origin: data.origin || 'Unknown',
    purposeOfVisit: data.purposeOfVisit || 'Leisure',
    arrivalDate: parseFirestoreDate(data.arrivalDate),
    departureDate: parseFirestoreDate(data.departureDate),
    visitedDestinations: toStringList(data.visitedDestinations),
    accommodationId: data.accommodationId || null,
    accommodation: data.accommodation || null,
    eventAttended: data.eventAttended || null,
    ageGroup: data.ageGroup || null,
    gender: data.gender || null,
    international: data.international ?? null,
    createdAt: parseFirestoreDate(data.createdAt),
    encodedBy: data.encodedBy || '',
  };
}

function destinationCategoryLabel(value) {
  const key = String(value || '').toLowerCase();
  if (key.includes('religious') || key.includes('church')) return 'Church';
  if (key.includes('nature') || key.includes('park')) return 'Nature';
  if (key.includes('food') || key.includes('restaurant')) return 'Food';
  if (key.includes('shopping') || key.includes('mall') || key.includes('shop')) return 'Shopping';
  if (key.includes('event')) return 'Events';
  if (key.includes('historical') || key.includes('heritage') || key.includes('landmark')) return 'Historical';
  if (key.includes('culture') || key.includes('museum')) return 'Culture';
  return 'Culture';
}

function businessCategoryToDestinationCategory(category) {
  if (category === 'restaurant') return 'Food';
  if (category === 'shop') return 'Shopping';
  if (category === 'entertainment') return 'Culture';
  return 'Culture';
}

function accommodationTypeLabel(value) {
  const key = String(value || '').toLowerCase();
  if (key === 'pensionhouse') return 'Pension House';
  if (key === 'hotel') return 'Hotel';
  if (key === 'inn') return 'Inn';
  if (key === 'hostel') return 'Hostel';
  if (key === 'resort') return 'Resort';
  return 'Stay';
}

function businessCategoryLabel(value) {
  const key = String(value || '').toLowerCase();
  if (key === 'restaurant') return 'Restaurant';
  if (key === 'hotel') return 'Hotel';
  if (key === 'resort') return 'Resort';
  if (key === 'attraction') return 'Tourist Attraction';
  if (key === 'shop') return 'Shop';
  if (key === 'entertainment') return 'Entertainment';
  if (key === 'transport') return 'Transportation';
  return 'Local Business';
}

function clusterToCrowdLevel(cluster, visitCount) {
  const key = String(cluster || '').toLowerCase();
  if (key.includes('hotspot')) return 'Crowded';
  if (key.includes('midtier') || key.includes('mid-tier')) return 'Busy';
  if (key.includes('underutilized')) return 'Low';
  if (visitCount > 50) return 'Busy';
  if (visitCount > 20) return 'Moderate';
  return 'Low';
}

function formatPriceRange(min, max) {
  const low = toNumber(min);
  const high = toNumber(max);
  if (!low && !high) return 'Rate TBD';
  if (low && high && low !== high) return `PHP ${Math.round(low)} - PHP ${Math.round(high)}`;
  return `PHP ${Math.round(low || high)}`;
}

function imageGallery(images, fallback) {
  const sources = Array.from(new Set([...(images || []), fallback].filter(Boolean)));
  return sources.map((image, index) => ({
    id: `backend-photo-${index}`,
    category: index === 0 ? 'Exterior' : 'Nearby',
    image,
  }));
}

function formatOperatingHours(hours) {
  if (!Array.isArray(hours) || !hours.length) return 'Not provided';
  const openDay = hours.find((hour) => hour?.isOpen);
  if (!openDay) return 'Not provided';
  return `${openDay.openTime || 'Open'} - ${openDay.closeTime || 'Close'}`;
}

function formatDistanceFromCenter(latitude, longitude) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  if (lat == null || lng == null) return 'Naga City';

  const center = { latitude: 13.6218, longitude: 123.1948 };
  const distance = haversineDistance(center.latitude, center.longitude, lat, lng);
  if (distance < 1) return `${Math.round(distance * 1000)} m`;
  return `${distance.toFixed(1)} km`;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const earthKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * earthKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function parseFirestoreDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}
