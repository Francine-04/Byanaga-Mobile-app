import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import Screen from '../../components/Screen';
import {
  loginTraveler,
  signOutTraveler,
  signInWithSocialCredential,
  signInWithWebSocialProvider,
  travelerRecordToAppState,
} from '../../services/authService';
import { clearRememberedTraveler, getRememberedTraveler, rememberTraveler } from '../../services/rememberMeService';
import { getFirebaseAuthMessage, incorrectLoginMessage, normalizeEmail, validateLoginForm } from '../../utils/authValidation';
import {
  assertNativeProviderConfigured,
  facebookAuthRequestConfig,
  googleAuthRequestConfig,
  socialAuthRedirectOptions,
} from '../../config/socialAuthConfig';

WebBrowser.maybeCompleteAuthSession();

const socialProviders = [
  { key: 'google', icon: 'logo-google', label: 'Google' },
  { key: 'facebook', icon: 'logo-facebook', label: 'Facebook' },
  { key: 'apple', icon: 'logo-apple', label: 'Apple' },
];

export default function LoginScreen({ navigation, route }) {
  const { theme, setIsGuestMode, setIsLoggedIn, setPreferences, setProfile, setSavedTrips } = useApp();
  const [email, setEmail] = useState(normalizeEmail(route.params?.email || ''));
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticatingProvider, setAuthenticatingProvider] = useState(null);
  const [pendingNativeProvider, setPendingNativeProvider] = useState(null);
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest(googleAuthRequestConfig, socialAuthRedirectOptions);
  const [facebookRequest, facebookResponse, promptFacebookAsync] = Facebook.useAuthRequest(facebookAuthRequestConfig, socialAuthRedirectOptions);
  const loginColors = getLoginColors(theme.dark);
  const isBusy = loading || Boolean(authenticatingProvider);

  useEffect(() => {
    let active = true;
    getRememberedTraveler().then((saved) => {
      if (!active || !saved?.email) return;
      setEmail(saved.email);
      setRemember(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (route.params?.message) {
      setFormError(route.params.message);
    }
  }, [route.params?.message]);

  useEffect(() => {
    if (route.params?.email) setEmail(normalizeEmail(route.params.email));
  }, [route.params?.email]);

  const updateEmail = (value) => {
    setEmail(normalizeEmail(value));
    setErrors((current) => ({ ...current, email: '' }));
    setFormError('');
  };

  const updatePassword = (value) => {
    setPassword(value);
    setErrors((current) => ({ ...current, password: '' }));
    setFormError('');
  };

  const continueAfterEmailLogin = useCallback((result) => {
    setIsGuestMode(false);
    setIsLoggedIn(true);
    if (result.createdTravelerRecord || !hasSavedPreferences(result.record?.preferences)) {
      navigation.navigate('RegisterStep2', { socialOnboarding: true });
    } else if (result.record?.onboardingCompletedAt) {
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      navigation.getParent()?.navigate('LocationPermission');
    }
  }, [navigation, setIsGuestMode, setIsLoggedIn]);

  const continueAsGuest = async () => {
    setLoading(true);
    setFormError('');
    try {
      await signOutTraveler();
      setSavedTrips([]);
      setIsGuestMode(true);
      setIsLoggedIn(true);
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      setFormError('Unable to start guest mode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeSocialLogin = useCallback(async (result) => {
    const appState = travelerRecordToAppState(result.record, result.user);
    setProfile((current) => ({ ...current, ...appState.profile }));
    setPreferences((current) => ({ ...current, ...appState.preferences }));

    if (remember) await rememberTraveler({ uid: result.user.uid, email: result.user.email || appState.profile.email || '' });
    else await clearRememberedTraveler();

    setIsGuestMode(false);
    setIsLoggedIn(true);
    if (result.record?.onboardingCompletedAt) {
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      navigation.navigate('RegisterStep2', { socialOnboarding: true });
    }
  }, [navigation, remember, setPreferences, setProfile, setIsGuestMode, setIsLoggedIn]);

  const showSocialError = useCallback((error) => {
    const message = getSocialAuthMessage(error);
    setFormError(message);
    Alert.alert('Sign-In Failed', message);
  }, []);

  const handleNativeAuthResult = useCallback(async (provider, response) => {
    if (!response) return;

    try {
      if (response.type === 'cancel' || response.type === 'dismiss') {
        setFormError('Sign-in was cancelled.');
        return;
      }

      if (response.type !== 'success') {
        throw response.error || new Error('Unable to complete social sign-in.');
      }

      const result = await signInWithSocialCredential({
        provider,
        idToken: response.params?.id_token || response.authentication?.idToken,
        accessToken: response.params?.access_token || response.authentication?.accessToken,
      });

      await completeSocialLogin(result);
    } catch (error) {
      showSocialError(error);
    } finally {
      setPendingNativeProvider(null);
      setAuthenticatingProvider(null);
    }
  }, [completeSocialLogin, showSocialError]);

  useEffect(() => {
    if (pendingNativeProvider === 'google') handleNativeAuthResult('google', googleResponse);
  }, [googleResponse, handleNativeAuthResult, pendingNativeProvider]);

  useEffect(() => {
    if (pendingNativeProvider === 'facebook') handleNativeAuthResult('facebook', facebookResponse);
  }, [facebookResponse, handleNativeAuthResult, pendingNativeProvider]);

  const handleAppleSignIn = async () => {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple sign-in is available on supported iOS devices only.');
    }

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const result = await signInWithSocialCredential({
      provider: 'apple',
      idToken: appleCredential.identityToken,
      profile: getAppleProfile(appleCredential),
    });

    await completeSocialLogin(result);
  };

  const handleSocialLogin = async (provider) => {
    if (provider === 'apple') {
      const message = 'Apple sign-in is coming soon. Please use Google, Facebook, or your email to continue.';
      setFormError(message);
      if (Platform.OS !== 'web') Alert.alert('Coming Soon', message);
      return;
    }

    setAuthenticatingProvider(provider);
    setPendingNativeProvider(null);
    setErrors({});
    setFormError('');

    try {
      if (Platform.OS === 'web') {
        const result = await signInWithWebSocialProvider(provider);
        await completeSocialLogin(result);
        setAuthenticatingProvider(null);
        return;
      }

      if (provider === 'google') {
        assertNativeProviderConfigured('google');
        if (!googleRequest) throw new Error('Google sign-in is still loading. Please try again.');
        setPendingNativeProvider('google');
        await promptGoogleAsync();
        return;
      }

      if (provider === 'facebook') {
        assertNativeProviderConfigured('facebook');
        if (!facebookRequest) throw new Error('Facebook sign-in is still loading. Please try again.');
        setPendingNativeProvider('facebook');
        await promptFacebookAsync();
        return;
      }

      await handleAppleSignIn();
      setAuthenticatingProvider(null);
    } catch (error) {
      setPendingNativeProvider(null);
      setAuthenticatingProvider(null);
      showSocialError(error);
    }
  };

  const handleLogin = async () => {
    const nextErrors = validateLoginForm({ email, password });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setFormError('Please enter your registered Gmail address and password.');
      return;
    }

    setLoading(true);
    setErrors({});
    setFormError('');

    try {
      const result = await loginTraveler({ email: normalizeEmail(email), password });
      if (remember) await rememberTraveler({ uid: result.user.uid, email: result.user.email || normalizeEmail(email) });
      else await clearRememberedTraveler();

      const appState = travelerRecordToAppState(result.record, result.user);
      setProfile((current) => ({ ...current, ...appState.profile }));
      setPreferences((current) => ({ ...current, ...appState.preferences }));
      continueAfterEmailLogin(result);
    } catch (error) {
      const message = getFirebaseAuthMessage(error);
      setFormError(message);
      if (message === incorrectLoginMessage) {
        Alert.alert('Login Failed', incorrectLoginMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Screen style={{ backgroundColor: loginColors.background }} contentStyle={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back!</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>Login to continue{'\n'}your journey.</Text>
        <View style={styles.form}>
          <AppTextInput
            value={email}
            onChangeText={updateEmail}
            placeholder="name@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <AppTextInput
            value={password}
            onChangeText={updatePassword}
            placeholder="Password"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            leftIcon="lock-closed-outline"
            rightIcon={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
            rightIconLabel={passwordVisible ? 'Hide password' : 'Show password'}
            onRightIconPress={() => setPasswordVisible((value) => !value)}
            error={errors.password}
          />
          <View style={styles.options}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember }}
              onPress={() => setRemember((value) => !value)}
              style={styles.remember}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: remember ? loginColors.primary : theme.colors.border, backgroundColor: remember ? loginColors.primary : 'transparent' },
                ]}
              >
                {remember ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
              </View>
              <Text style={[styles.optionText, { color: theme.colors.textMuted }]}>Remember Me</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Forgot password" disabled={isBusy} onPress={() => navigation.navigate('ForgotPassword', { email })} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={[styles.link, { color: loginColors.primary }]}>Forgot Password?</Text>
            </Pressable>
          </View>
          {formError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{formError}</Text> : null}
          <AppButton
            title={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={isBusy}
            style={{ backgroundColor: loginColors.primary, borderColor: loginColors.primary }}
            textStyle={{ color: '#FFFFFF' }}
          />
          <AppButton
            title="Continue as Guest"
            onPress={continueAsGuest}
            variant="outline"
            disabled={isBusy}
            style={[styles.secondaryButton, { borderColor: loginColors.primary }]}
            textStyle={{ color: loginColors.primary }}
          />
          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: theme.colors.textMuted }]}>Don't have an account?</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Register" onPress={() => navigation.navigate('RegisterStep1')}>
              <Text style={[styles.registerLink, { color: loginColors.primary }]}> Register</Text>
            </Pressable>
          </View>
          <Text style={[styles.socialLabel, { color: theme.colors.textMuted }]}>Or continue with</Text>
          <View style={styles.socials}>
            {socialProviders.map((provider) => (
              <Pressable
                key={provider.key}
                accessibilityRole="button"
                accessibilityLabel={`Continue with ${provider.label}`}
                disabled={isBusy}
                onPress={() => handleSocialLogin(provider.key)}
                style={[
                  styles.socialButton,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, opacity: isBusy ? 0.58 : 1 },
                ]}
              >
                <Ionicons name={provider.icon} size={30} color={getSocialColor(provider.icon, theme)} />
              </Pressable>
            ))}
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function getLoginColors(isDark) {
  return {
    background: isDark ? '#101820' : '#FAFBFC',
    primary: isDark ? '#4DB37A' : '#2E8B57',
    primarySoft: isDark ? '#183C2A' : '#E7F5ED',
  };
}

function hasSavedPreferences(preferences) {
  return Boolean(
    preferences?.places?.length &&
    preferences?.activities?.length &&
    preferences?.travelStyle &&
    preferences?.budget &&
    preferences?.duration
  );
}

function getSocialColor(icon, theme) {
  if (icon === 'logo-google') return '#4285F4';
  if (icon === 'logo-facebook') return '#1877F2';
  return theme.colors.text;
}

function getAppleProfile(credential) {
  const firstName = String(credential.fullName?.givenName || '').trim();
  const lastName = String(credential.fullName?.familyName || '').trim();
  const name = `${firstName} ${lastName}`.trim();

  return {
    email: credential.email || '',
    firstName,
    lastName,
    name,
  };
}

function getSocialAuthMessage(error) {
  const code = error?.code || '';
  if (code.includes('invalid-credential')) return 'Unable to verify this social sign-in. Please try again.';
  if (code.includes('operation-not-allowed')) return 'This social sign-in provider is not enabled in Firebase Authentication.';
  return getFirebaseAuthMessage(error);
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: 62,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  form: {
    marginTop: 30,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  remember: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  link: {
    fontSize: 12,
    fontWeight: '800',
  },
  error: {
    marginTop: -6,
    marginBottom: 14,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 14,
  },
  registerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '900',
  },
  socialLabel: {
    marginTop: 32,
    marginBottom: 18,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
  },
  socials: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  socialButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
