import { Platform } from 'react-native';
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  deleteUser,
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  verifyPasswordResetCode,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from './firebaseApp';
import { isGmailAddress, isStrongPassword, normalizeEmail, passwordRuleText } from '../utils/authValidation';
import { normalizePreferences } from '../utils/travelerPreferences';

const USERS_COLLECTION = 'users';
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

  try {
    // Use Firestore instead of Realtime Database
    await setDoc(doc(db, USERS_COLLECTION, user.uid), {
      uid: user.uid,
      userId: user.uid,
      email: user.email || email,
      username: profile.name || '',
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      name: profile.name || '',
      phoneNumber: profile.phone || '',
      age: profile.age || null,
      gender: profile.gender || '',
      nationality: profile.nationality || '',
      homeCity: profile.homeCity || '',
      countryOfOrigin: profile.countryOfOrigin || profile.nationality || '',
      image: profile.image || null,
      preferences: normalizePreferences(preferences),
      role: 'tourist',
      accountType: 'tourist',
      accountStatus: 'active',
      authProvider: 'password',
      authProviders: ['password'],
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } catch (error) {
    // Avoid leaving an Auth-only account when the traveler profile cannot be saved.
    await deleteUser(user).catch(() => {});
    throw error;
  }

  const record = await loadTravelerRecord(user.uid);
  return { user, record };
}

export async function loginTraveler({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const existing = await loadTravelerRecord(user.uid);

  // BLOCK: Check if user is staff/business (not tourist)
  if (existing && existing.role && existing.role !== 'tourist') {
    await signOut(auth); // Log them out immediately
    const error = new Error('Staff and business accounts cannot use the mobile app. Please use the web dashboard.');
    error.code = 'auth/role-not-allowed';
    throw error;
  }

  if (!existing) {
    const name = user.displayName || nameFromEmail(user.email || email) || 'Traveler';
    const parts = splitName(name);
    
    // Create new user document in Firestore
    await setDoc(doc(db, USERS_COLLECTION, user.uid), {
      uid: user.uid,
      userId: user.uid,
      email: user.email || normalizeEmail(email),
      username: name,
      firstName: parts.firstName,
      lastName: parts.lastName,
      name,
      phoneNumber: '',
      age: null,
      gender: '',
      nationality: '',
      homeCity: '',
      countryOfOrigin: '',
      image: user.photoURL || null,
      preferences: normalizePreferences(),
      role: 'tourist',
      accountType: 'tourist',
      accountStatus: 'active',
      authProvider: 'password',
      authProviders: user.providerData?.map((provider) => provider.providerId).filter(Boolean) || ['password'],
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    // Update existing user
    await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
      role: existing.role || 'tourist',
      accountType: existing.accountType || 'tourist',
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  }

  const record = await loadTravelerRecord(user.uid);
  
  // Double-check role after loading (in case it was just created/updated)
  if (record && record.role && record.role !== 'tourist') {
    await signOut(auth);
    const error = new Error('Staff and business accounts cannot use the mobile app. Please use the web dashboard.');
    error.code = 'auth/role-not-allowed';
    throw error;
  }
  
  return { user, record, createdTravelerRecord: !existing };
}

export async function sendTravelerPasswordReset(email) {
  const normalized = normalizeEmail(email);
  if (!isGmailAddress(normalized)) throw new Error('Enter the Gmail address you registered with.');
  try {
    await sendPasswordResetEmail(auth, normalized);
  } catch (error) {
    // Keep the response consistent when Firebase account enumeration protection is disabled.
    if (error?.code !== 'auth/user-not-found') throw error;
  }
}

export async function verifyTravelerPasswordReset(oobCode) {
  const code = String(oobCode || '').trim();
  if (!code) {
    const error = new Error('The password reset link is incomplete. Request a new link and try again.');
    error.code = 'auth/missing-action-code';
    throw error;
  }

  const email = await verifyPasswordResetCode(auth, code);
  return normalizeEmail(email);
}

export async function confirmTravelerPasswordReset({ oobCode, password }) {
  const code = String(oobCode || '').trim();
  if (!code) {
    const error = new Error('The password reset link is incomplete. Request a new link and try again.');
    error.code = 'auth/missing-action-code';
    throw error;
  }
  if (!isStrongPassword(password)) throw new Error(passwordRuleText);

  await confirmPasswordReset(auth, code, password);
}

export async function signInWithWebSocialProvider(providerKey) {
  if (Platform.OS !== 'web') {
    throw new Error('Web social provider sign-in is only available in the browser.');
  }

  const provider = createWebAuthProvider(providerKey);
  const credential = await signInWithPopup(auth, provider);
  return completeSocialSignIn(credential, providerKey).catch(rethrowSocialProfileError);
}

export async function signInWithSocialCredential({ provider, idToken, accessToken, profile }) {
  const authCredential = createProviderCredential({ provider, idToken, accessToken });
  const credential = await signInWithCredential(auth, authCredential);
  return completeSocialSignIn(credential, provider, profile).catch(rethrowSocialProfileError);
}

export async function signOutTraveler() {
  await signOut(auth);
}

export async function completeTravelerOnboarding(choice) {
  const user = await ensureAuthenticatedUser();
  await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
    locationPermission: choice,
    onboardingCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function loadTravelerRecord(userId) {
  if (!userId) return null;
  const docSnap = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  // Convert Firestore Timestamps to JavaScript objects for compatibility
  return {
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    lastLoginAt: data.lastLoginAt instanceof Timestamp ? data.lastLoginAt.toDate() : data.lastLoginAt,
  };
}

export function subscribeToTravelerRecord(userId, onRecord, onError) {
  return onSnapshot(
    doc(db, USERS_COLLECTION, userId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onRecord({
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          lastLoginAt: data.lastLoginAt instanceof Timestamp ? data.lastLoginAt.toDate() : data.lastLoginAt,
        });
      } else {
        onRecord(null);
      }
    },
    onError
  );
}

export async function toggleTravelerBookmark(userId, placeId) {
  const user = await ensureAuthenticatedUser();
  if (user.uid !== userId) throw new Error('Your session changed. Please log in again.');
  
  // Load current bookmarks
  const record = await loadTravelerRecord(userId);
  const bookmarks = Array.isArray(record?.bookmarks) ? record.bookmarks : [];
  
  // Toggle bookmark
  const newBookmarks = bookmarks.includes(placeId)
    ? bookmarks.filter((id) => id !== placeId)
    : [...bookmarks, placeId];
  
  // Update in Firestore
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    bookmarks: newBookmarks,
    updatedAt: serverTimestamp(),
  });
}

export async function saveTravelerPreferences(userId, preferences) {
  const user = await ensureAuthenticatedUser();
  if (user.uid !== userId) throw new Error('Your session changed. Please log in again.');
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    preferences: normalizePreferences(preferences),
    updatedAt: serverTimestamp(),
  });
}

export async function saveTravelerProfile(userId, profile) {
  const user = await ensureAuthenticatedUser();
  if (user.uid !== userId) throw new Error('Your session changed. Please log in again.');
  const name = String(profile.name || '').trim();
  if (!name) throw new Error('Please enter your full name.');
  const fields = {
    ...splitName(name),
    name,
    username: name,
    phone: String(profile.phone || '').trim(),
    phoneNumber: String(profile.phone || '').trim(),
    bio: String(profile.bio || '').trim(),
    coverImage: profile.coverImage || null,
    nationality: profile.nationality || '',
    image: profile.image || null,
  };
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
  // The database is authoritative; optional Auth metadata must not delay saving.
  if (auth.currentUser?.uid === userId && auth.currentUser.displayName !== name) {
    updateProfile(auth.currentUser, { displayName: name }).catch(() => {});
  }
  return { ...profile, ...fields };
}

export function travelerRecordToAppState(record, user) {
  const name = record?.name || user?.displayName || 'Traveler';

  return {
    profile: {
      name,
      phone: record?.phone || '',
      bio: record?.bio ?? 'I love exploring new places!',
      nationality: record?.nationality ?? 'Filipino',
      image: record?.image || null,
      coverImage: record?.coverImage || null,
      email: record?.email || user?.email || '',
      firstName: record?.firstName || splitName(name).firstName,
      lastName: record?.lastName || splitName(name).lastName,
      age: record?.age || null,
      gender: record?.gender || '',
    },
    preferences: normalizePreferences(record?.preferences),
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
  const providerIds = user.providerData?.map((provider) => provider.providerId).filter(Boolean) || [];

  if (!existing) {
    // Create new user in Firestore
    await setDoc(doc(db, USERS_COLLECTION, user.uid), stripUndefined({
      uid: user.uid,
      userId: user.uid,
      email: socialProfile.email,
      username: socialProfile.name,
      firstName: socialProfile.firstName,
      lastName: socialProfile.lastName,
      name: socialProfile.name,
      phoneNumber: '',
      age: null,
      gender: '',
      nationality: '',
      homeCity: '',
      countryOfOrigin: '',
      image: socialProfile.image,
      preferences: normalizePreferences(),
      role: 'tourist',
      accountType: 'tourist',
      accountStatus: 'active',
      authProvider: providerKey,
      authProviders: providerIds,
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }));
  } else {
    // Update existing user
    await updateDoc(doc(db, USERS_COLLECTION, user.uid), stripUndefined({
      email: existing.email || socialProfile.email,
      firstName: existing.firstName ?? splitName(existing.name || socialProfile.name).firstName,
      lastName: existing.lastName ?? splitName(existing.name || socialProfile.name).lastName,
      name: existing.name || socialProfile.name,
      username: existing.username || existing.name || socialProfile.name,
      image: existing.image || socialProfile.image,
      authProvider: existing.authProvider || providerKey,
      authProviders: providerIds.length ? providerIds : existing.authProviders,
      emailVerified: user.emailVerified,
      role: existing.role || 'tourist',
      accountType: existing.accountType || 'tourist',
      accountStatus: existing.accountStatus || 'active',
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }));
  }

  const record = await loadTravelerRecord(user.uid);
  
  // BLOCK: Check if user is staff/business (not tourist)
  if (record && record.role && record.role !== 'tourist') {
    await signOut(auth); // Log them out immediately
    const error = new Error('Staff and business accounts cannot use the mobile app. Please use the web dashboard.');
    error.code = 'auth/role-not-allowed';
    throw error;
  }
  
  return { user, record };
}

function rethrowSocialProfileError(cause) {
  const code = String(cause?.code || '').toLowerCase().replace(/_/g, '-');
  if (code.includes('permission-denied') || /permission denied/i.test(cause?.message || '')) {
    const error = new Error('Your sign-in succeeded, but BYANAGA could not access your traveler profile. Database permissions need to be updated. Please try again after this is fixed.');
    error.code = 'auth/profile-permission-denied';
    error.cause = cause;
    throw error;
  }
  throw cause;
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
