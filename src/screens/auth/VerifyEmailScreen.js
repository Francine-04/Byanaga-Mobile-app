import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import { useApp } from '../../context/AppContext';
import {
  confirmTravelerEmailVerification,
  resendTravelerVerificationEmail,
  signOutTraveler,
} from '../../services/authService';
import { getFirebaseAuthMessage } from '../../utils/authValidation';

export default function VerifyEmailScreen({ navigation, route }) {
  const { theme, onboardingStep, setIsLoggedIn } = useApp();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(route.params?.sendError
    ? 'Your account was saved, but the confirmation email could not be sent. Please tap Resend email.'
    : 'We sent a confirmation link to your email. Open it, then return here.');
  const [error, setError] = useState('');

  const check = async () => {
    setBusy(true);
    setError('');
    try {
      const verified = await confirmTravelerEmailVerification();
      if (!verified) {
        setError('Email is not verified yet. Open the link in your inbox, then try again.');
        return;
      }
      const next = route.params?.next;
      if (next === 'LocationPermission' || onboardingStep === 'location') {
        navigation.getParent()?.reset({ index: 0, routes: [{ name: 'LocationPermission' }] });
      } else if (onboardingStep === 'preferences') {
        navigation.navigate('RegisterStep2', { socialOnboarding: true });
      } else {
        navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } catch (verifyError) {
      setError(getFirebaseAuthMessage(verifyError));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError('');
    try {
      const sent = await resendTravelerVerificationEmail();
      setMessage(sent ? 'A new confirmation email was sent. Check your inbox and spam folder.' : 'Your email is already verified. Tap I verified my email.');
    } catch (sendError) {
      setError(getFirebaseAuthMessage(sendError));
    } finally {
      setBusy(false);
    }
  };

  const switchAccount = async () => {
    setBusy(true);
    try {
      await signOutTraveler();
      setIsLoggedIn(false);
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Auth', params: { screen: 'Login' } }] });
    } catch (signOutError) {
      setError(getFirebaseAuthMessage(signOutError));
      setBusy(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Confirm your email</Text>
        <Text style={[styles.email, { color: theme.colors.text }]}>{route.params?.email || 'your email address'}</Text>
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton title={busy ? 'Checking…' : 'I verified my email'} onPress={check} disabled={busy} />
        <AppButton title="Resend email" variant="outline" onPress={resend} disabled={busy} />
        <AppButton title="Use a different account" variant="ghost" onPress={switchAccount} disabled={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  body: { gap: 18 },
  title: { fontSize: 28, fontWeight: '800' },
  email: { fontSize: 16, fontWeight: '700' },
  message: { fontSize: 15, lineHeight: 23 },
  error: { color: '#c53434', lineHeight: 22 },
});
