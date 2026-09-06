import { Platform } from 'react-native';

export const SOCIAL_AUTH_SCHEME = 'byanaga';

const FALLBACK_CLIENT_ID = 'byanaga-social-auth-client-id-required';
const env = {
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  EXPO_PUBLIC_FACEBOOK_APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
};

export const socialAuthRedirectOptions = {
  scheme: SOCIAL_AUTH_SCHEME,
  native: `${SOCIAL_AUTH_SCHEME}://auth`,
  path: 'auth',
};

export const googleAuthRequestConfig = {
  webClientId: getAuthSessionClientId('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  iosClientId: getAuthSessionClientId('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  androidClientId: getAuthSessionClientId('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
  selectAccount: true,
};

export const facebookAuthRequestConfig = {
  webClientId: getAuthSessionClientId('EXPO_PUBLIC_FACEBOOK_APP_ID'),
  iosClientId: getAuthSessionClientId('EXPO_PUBLIC_FACEBOOK_APP_ID'),
  androidClientId: getAuthSessionClientId('EXPO_PUBLIC_FACEBOOK_APP_ID'),
  scopes: ['public_profile', 'email'],
};

export function assertNativeProviderConfigured(provider) {
  if (Platform.OS === 'web') return;

  if (provider === 'google' && !getPlatformGoogleClientId()) {
    throw new Error(
      'Google sign-in is not configured yet. Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID to .env, then rebuild the development app.'
    );
  }

  if (provider === 'facebook' && !readEnv('EXPO_PUBLIC_FACEBOOK_APP_ID')) {
    throw new Error(
      'Facebook sign-in is not configured yet. Add EXPO_PUBLIC_FACEBOOK_APP_ID to .env, enable Facebook in Firebase Authentication, then rebuild the development app.'
    );
  }
}

function getPlatformGoogleClientId() {
  if (Platform.OS === 'ios') return readEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
  if (Platform.OS === 'android') return readEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
  return readEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
}

function getAuthSessionClientId(key) {
  return readEnv(key) || FALLBACK_CLIENT_ID;
}

function readEnv(key) {
  return String(env[key] || '').trim();
}
