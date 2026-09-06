import { Platform } from 'react-native';
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { get, ref, serverTimestamp, set, update } from 'firebase/database';
import { auth, realtimeDb } from './firebaseApp';

const USERS_PATH = 'users';
export const AUTH_REQUIRED_ERROR_CODE = 'auth/required';

export function subscribeToAuthState(onUser) {
  return onAuthStateChanged(auth, onUser);
}

export function getCurrentFirebaseUser() {
  return auth.currentUser;
}

export async function ensureAuthenticatedUser() {
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    return auth.currentUser;
  }

  const error = new Error('Log in to save your itinerary.');
  error.code = AUTH_REQUIRED_ERROR_CODE;
  throw error;
}

export function isAuthRequiredError(error) {
  return error?.code === AUTH_REQUIRED_ERROR_CODE;
}

export async function registerTraveler({ email, password, profile, preferences }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  if (profile?.name) {
    await updateProfile(user, { displayName: profile.name }).catch(() => {});
  }

  await set(ref(realtimeDb, `${USERS_PATH}/${user.uid}`), {
    userId: user.uid,
    email: user.email || email,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    name: profile.name || '',
    age: profile.age || null,
    gender: profile.gender || '',
    nationality: profile.nationality || '',
    image: profile.image || null,
    preferences: normalizePreferences(preferences),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const record = await loadTravelerRecord(user.uid);
  return { user, record };
}

export async function loginTraveler({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const record = await loadTravelerRecord(credential.user.uid);
  return { user: credential.user, record };
}

export async function signInWithWebSocialProvider(providerKey) {
  if (Platform.OS !== 'web') {
    throw new Error('Web social provider sign-in is only available in the browser.');
  }

  const provider = createWebAuthProvider(providerKey);
  const credential = await signInWithPopup(auth, provider);
  return completeSocialSignIn(credential, providerKey);
}

export async function signInWithSocialCredential({ provider, idToken, accessToken, profile }) {
  const authCredential = createProviderCredential({ provider, idToken, accessToken });
  const credential = await signInWithCredential(auth, authCredential);
  return completeSocialSignIn(credential, provider, profile);
}

export async function signOutTraveler() {
  await signOut(auth);
}

export async function loadTravelerRecord(userId) {
  if (!userId) return null;
  const snapshot = await get(ref(realtimeDb, `${USERS_PATH}/${userId}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function saveTravelerPreferences(userId, preferences) {
  if (!userId) throw new Error('Missing authenticated user.');
  await update(ref(realtimeDb, `${USERS_PATH}/${userId}`), {
    preferences: normalizePreferences(preferences),
    updatedAt: serverTimestamp(),
  });
}

export async function saveTravelerProfile(userId, profile) {
  if (!userId) throw new Error('Missing authenticated user.');
  if (auth.currentUser?.uid === userId && profile.name) {
    await updateProfile(auth.currentUser, { displayName: profile.name }).catch(() => {});
  }

  await update(ref(realtimeDb, `${USERS_PATH}/${userId}`), {
    firstName: profile.firstName || splitName(profile.name).firstName,
    lastName: profile.lastName || splitName(profile.name).lastName,
    name: profile.name || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
    nationality: profile.nationality || '',
    image: profile.image || null,
    updatedAt: serverTimestamp(),
  });
}

export function travelerRecordToAppState(record, user) {
  const name = record?.name || user?.displayName || 'Traveler';

  return {
    profile: {
      name,
      phone: record?.phone || '',
      bio: record?.bio || 'I love exploring new places!',
      nationality: record?.nationality || 'Filipino',
      image: record?.image || null,
      email: record?.email || user?.email || '',
      firstName: record?.firstName || splitName(name).firstName,
      lastName: record?.lastName || splitName(name).lastName,
      age: record?.age || null,
      gender: record?.gender || '',
    },
    preferences: normalizePreferences(record?.preferences),
  };
}

function normalizePreferences(preferences = {}) {
  return {
    places: Array.isArray(preferences.places) ? preferences.places : [],
    activities: Array.isArray(preferences.activities) ? preferences.activities : [],
    travelStyle: preferences.travelStyle || 'Solo',
    budget: preferences.budget || 'Moderate',
    duration: preferences.duration || 'One Day',
  };
}

function splitName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function createWebAuthProvider(providerKey) {
  if (providerKey === 'google') {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }

  if (providerKey === 'facebook') {
    const provider = new FacebookAuthProvider();
    provider.addScope('public_profile');
    provider.addScope('email');
    return provider;
  }

  if (providerKey === 'apple') {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    return provider;
  }

  throw new Error('Unsupported social sign-in provider.');
}

function createProviderCredential({ provider, idToken, accessToken }) {
  if (provider === 'google') {
    if (!idToken && !accessToken) throw new Error('Google did not return a sign-in token.');
    return GoogleAuthProvider.credential(idToken || null, accessToken || null);
  }

  if (provider === 'facebook') {
    if (!accessToken) throw new Error('Facebook did not return a sign-in token.');
    return FacebookAuthProvider.credential(accessToken);
  }

  if (provider === 'apple') {
    if (!idToken) throw new Error('Apple did not return an identity token.');
    const appleProvider = new OAuthProvider('apple.com');
    const appleCredential = { idToken };
    if (accessToken) appleCredential.accessToken = accessToken;
    return appleProvider.credential(appleCredential);
  }

  throw new Error('Unsupported social sign-in provider.');
}

async function completeSocialSignIn(credential, providerKey, profileOverrides = {}) {
  const user = credential.user;
  if (!user?.uid) throw new Error('Social sign-in did not return a Firebase user.');

  const existing = await loadTravelerRecord(user.uid);
  const socialProfile = buildSocialProfile(user, profileOverrides);
  const userRef = ref(realtimeDb, `${USERS_PATH}/${user.uid}`);
  const providerIds = user.providerData?.map((provider) => provider.providerId).filter(Boolean) || [];

  if (!existing) {
    await set(userRef, stripUndefined({
      userId: user.uid,
      email: socialProfile.email,
      firstName: socialProfile.firstName,
      lastName: socialProfile.lastName,
      name: socialProfile.name,
      age: null,
      gender: '',
      nationality: '',
      image: socialProfile.image,
      preferences: normalizePreferences(),
      authProvider: providerKey,
      authProviders: providerIds,
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }));
  } else {
    await update(userRef, stripUndefined({
      email: existing.email || socialProfile.email,
      firstName: existing.firstName || socialProfile.firstName,
      lastName: existing.lastName || socialProfile.lastName,
      name: existing.name || socialProfile.name,
      image: existing.image || socialProfile.image,
      authProvider: existing.authProvider || providerKey,
      authProviders: providerIds.length ? providerIds : existing.authProviders,
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }));
  }

  const record = await loadTravelerRecord(user.uid);
  return { user, record };
}

function buildSocialProfile(user, overrides = {}) {
  const providerProfile = user.providerData?.find((provider) => provider.displayName || provider.email || provider.photoURL) || {};
  const email = overrides.email || user.email || providerProfile.email || '';
  const name = overrides.name || user.displayName || providerProfile.displayName || nameFromEmail(email) || 'Traveler';
  const parts = splitName(name);

  return {
    email,
    name,
    firstName: overrides.firstName || parts.firstName,
    lastName: overrides.lastName || parts.lastName,
    image: overrides.image || user.photoURL || providerProfile.photoURL || null,
  };
}

function nameFromEmail(email) {
  const local = String(email || '').split('@')[0];
  if (!local) return '';
  return local
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function stripUndefined(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => typeof value !== 'undefined'));
}
