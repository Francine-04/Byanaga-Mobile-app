import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import Screen from '../../components/Screen';
import BrandMark from '../../components/BrandMark';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import {
  confirmTravelerPasswordReset,
  sendTravelerPasswordReset,
  verifyTravelerPasswordReset,
} from '../../services/authService';
import {
  getFirebaseAuthMessage,
  isGmailAddress,
  isStrongPassword,
  normalizeEmail,
  passwordRuleText,
} from '../../utils/authValidation';
import { getPasswordResetAction, parsePasswordResetLink } from '../../utils/passwordResetAction';

const RESEND_SECONDS = 60;

export default function ForgotPasswordScreen({ navigation, route }) {
  const { theme } = useApp();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(normalizeEmail(route.params?.email || ''));
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [actionCode, setActionCode] = useState('');
  const [pastedLink, setPastedLink] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const sending = useRef(false);
  const handledCode = useRef('');
  const mounted = useRef(true);
  const green = theme.brand.green;

  useEffect(() => () => {
    mounted.current = false;
  }, []);

  useEffect(() => {
    if (!remaining) return undefined;
    const timer = setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const verifyAction = useCallback(async (action) => {
    if (!action?.oobCode || handledCode.current === action.oobCode) return;

    handledCode.current = action.oobCode;
    setError('');
    setLoading(true);
    setStep('verifying');

    try {
      const accountEmail = await verifyTravelerPasswordReset(action.oobCode);
      if (!mounted.current) return;
      setActionCode(action.oobCode);
      setVerifiedEmail(accountEmail);
      setEmail(accountEmail);
      setPastedLink('');
      setStep('password');
    } catch (cause) {
      if (!mounted.current) return;
      handledCode.current = '';
      setActionCode('');
      setStep('verify');
      setError(getFirebaseAuthMessage(cause));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const routeAction = getPasswordResetAction({
      mode: route.params?.mode,
      oobCode: route.params?.oobCode,
      url: route.params?.actionUrl,
    });
    if (routeAction) verifyAction(routeAction);
  }, [route.params?.actionUrl, route.params?.mode, route.params?.oobCode, verifyAction]);

  useEffect(() => {
    const handleUrl = (url) => {
      const action = parsePasswordResetLink(url);
      if (action) verifyAction(action);
    };

    Linking.getInitialURL().then(handleUrl).catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, [verifyAction]);

  const sendResetLink = async () => {
    if (sending.current || (step === 'verify' && remaining > 0)) return;

    const normalized = normalizeEmail(email);
    setEmail(normalized);
    setError('');
    if (!isGmailAddress(normalized)) {
      setError(normalized ? 'Enter the Gmail address you registered with.' : 'Please enter your email address.');
      return;
    }

    Keyboard.dismiss();
    sending.current = true;
    setLoading(true);
    try {
      await sendTravelerPasswordReset(normalized);
      if (!mounted.current) return;
      setStep('verify');
      setRemaining(RESEND_SECONDS);
    } catch (cause) {
      if (mounted.current) setError(getFirebaseAuthMessage(cause));
    } finally {
      sending.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const verifyPastedLink = () => {
    const action = parsePasswordResetLink(pastedLink);
    if (!action) {
      setError('Paste the complete reset link from your BYANAGA email.');
      return;
    }
    verifyAction(action);
  };

  const resetPassword = async () => {
    setError('');
    if (!password) {
      setError('Enter your new password.');
      return;
    }
    if (!isStrongPassword(password)) {
      setError(passwordRuleText);
      return;
    }
    if (!confirmPassword) {
      setError('Confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      await confirmTravelerPasswordReset({ oobCode: actionCode, password });
      if (!mounted.current) return;
      clearResetUrl();
      setStep('success');
    } catch (cause) {
      if (mounted.current) setError(getFirebaseAuthMessage(cause));
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { email: verifiedEmail || email } }],
    });
  };

  const goBack = () => {
    setError('');
    if (step === 'verify' || step === 'verifying') {
      setStep('email');
      return;
    }
    if (step === 'password') {
      setStep('verify');
      return;
    }
    goToLogin();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        style={{ backgroundColor: theme.colors.background }}
        contentStyle={[styles.content, (step === 'success' || step === 'verifying') && styles.centeredContent]}
      >
        <View style={styles.inner}>
          {step !== 'email' && step !== 'success' ? <BackButton color={theme.colors.text} onPress={goBack} /> : null}
          {step === 'email' ? (
            <EmailStep
              email={email}
              error={error}
              green={green}
              loading={loading}
              theme={theme}
              onBack={goToLogin}
              onChangeEmail={(value) => {
                setEmail(normalizeEmail(value));
                setError('');
              }}
              onSubmit={sendResetLink}
            />
          ) : null}
          {step === 'verify' ? (
            <VerifyStep
              email={email}
              error={error}
              green={green}
              link={pastedLink}
              loading={loading}
              remaining={remaining}
              theme={theme}
              onChangeLink={(value) => {
                setPastedLink(value);
                setError('');
              }}
              onResend={sendResetLink}
              onVerify={verifyPastedLink}
            />
          ) : null}
          {step === 'verifying' ? <VerifyingStep green={green} theme={theme} /> : null}
          {step === 'password' ? (
            <PasswordStep
              confirmPassword={confirmPassword}
              confirmVisible={confirmVisible}
              email={verifiedEmail}
              error={error}
              green={green}
              loading={loading}
              password={password}
              passwordVisible={passwordVisible}
              theme={theme}
              onChangeConfirm={(value) => {
                setConfirmPassword(value.slice(0, 15));
                setError('');
              }}
              onChangePassword={(value) => {
                setPassword(value.slice(0, 15));
                setError('');
              }}
              onSubmit={resetPassword}
              onToggleConfirm={() => setConfirmVisible((value) => !value)}
              onTogglePassword={() => setPasswordVisible((value) => !value)}
            />
          ) : null}
          {step === 'success' ? <SuccessStep green={green} theme={theme} onLogin={goToLogin} /> : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function EmailStep({ email, error, green, loading, onBack, onChangeEmail, onSubmit, theme }) {
  return (
    <View style={styles.emailStep}>
      <BrandMark size="large" showTagline={false} style={styles.brand} />
      <AccentTitle before="Forgot" accent="Password?" color={theme.colors.text} green={green} />
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>Enter your registered Gmail address and we'll send a secure link to reset your password.</Text>
      <AppTextInput
        accessibilityLabel="Registered Gmail address"
        placeholder="Email Address"
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        editable={!loading}
        returnKeyType="send"
        onSubmitEditing={onSubmit}
        error={error}
        onChangeText={onChangeEmail}
      />
      <AppButton
        title={loading ? 'Sending...' : 'Continue'}
        icon="arrow-forward"
        iconPosition="right"
        onPress={onSubmit}
        disabled={loading}
        style={[styles.primaryButton, { backgroundColor: green, borderColor: green }]}
        textStyle={styles.whiteText}
      />
      <AppButton title="Back to Login" icon="arrow-back" variant="ghost" onPress={onBack} style={styles.loginBack} textStyle={{ color: theme.colors.textMuted }} />
    </View>
  );
}

function VerifyStep({ email, error, green, link, loading, onChangeLink, onResend, onVerify, remaining, theme }) {
  return (
    <View style={styles.stepBody}>
      <ResetHeroIcon icon="mail-unread-outline" color={green} theme={theme} />
      <AccentTitle before="Verify Your" accent="Account" color={theme.colors.text} green={green} />
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>We sent a secure reset link to <Text style={[styles.emphasis, { color: theme.colors.text }]}>{maskEmail(email)}</Text>. Open it to verify your account.</Text>
      <View style={[styles.notice, { backgroundColor: theme.colors.primarySoft, borderColor: green }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={green} />
        <Text style={[styles.noticeText, { color: theme.colors.text }]}>Reset your password using the secure email page, or paste the complete link below to continue here.</Text>
      </View>
      <AppTextInput
        accessibilityLabel="Password reset link"
        placeholder="Paste reset link"
        leftIcon="link-outline"
        autoCapitalize="none"
        autoCorrect={false}
        value={link}
        editable={!loading}
        returnKeyType="done"
        onSubmitEditing={onVerify}
        error={error}
        onChangeText={onChangeLink}
      />
      <AppButton
        title={loading ? 'Verifying...' : 'Verify Secure Link'}
        icon="arrow-forward"
        iconPosition="right"
        onPress={onVerify}
        disabled={loading || !link.trim()}
        style={[styles.primaryButton, !loading && link.trim() && { backgroundColor: green, borderColor: green }]}
        textStyle={!loading && link.trim() ? styles.whiteText : undefined}
      />
      <View style={styles.resendRow}>
        <Text style={[styles.resendLabel, { color: theme.colors.textMuted }]}>Didn't receive the email?</Text>
        <Pressable accessibilityRole="button" disabled={remaining > 0 || loading} onPress={onResend} style={styles.resendButton}>
          <Text style={[styles.resendLink, { color: remaining > 0 ? theme.colors.textSoft : green }]}> {remaining > 0 ? `Resend in ${remaining}s` : 'Resend Link'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function VerifyingStep({ green, theme }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.loadingStep}>
      <ResetHeroIcon icon="shield-checkmark-outline" color={green} theme={theme} />
      <Text accessibilityRole="header" style={[styles.title, styles.centerText, { color: theme.colors.text }]}>Verifying Your Link</Text>
      <Text style={[styles.description, styles.centerText, { color: theme.colors.textMuted }]}>Checking your secure Firebase reset request.</Text>
      <ActivityIndicator size="large" color={green} style={styles.spinner} />
    </View>
  );
}

function PasswordStep({ confirmPassword, confirmVisible, email, error, green, loading, onChangeConfirm, onChangePassword, onSubmit, onToggleConfirm, onTogglePassword, password, passwordVisible, theme }) {
  const rules = [
    { label: '8 to 15 characters', valid: password.length >= 8 && password.length <= 15 },
    { label: 'At least 1 uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'At least 1 number', valid: /[0-9]/.test(password) },
    { label: 'At least 1 special character', valid: /[^A-Za-z0-9]/.test(password) },
    { label: 'Passwords match', valid: Boolean(confirmPassword) && password === confirmPassword },
  ];

  return (
    <View style={styles.stepBody}>
      <ResetHeroIcon icon="lock-closed" color={green} theme={theme} compact />
      <AccentTitle before="Create New" accent="Password" color={theme.colors.text} green={green} />
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>Choose a new password for <Text style={[styles.emphasis, { color: theme.colors.text }]}>{maskEmail(email)}</Text>.</Text>
      <AppTextInput
        accessibilityLabel="New password"
        placeholder="New Password"
        leftIcon="lock-closed-outline"
        rightIcon={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
        rightIconLabel={passwordVisible ? 'Hide new password' : 'Show new password'}
        onRightIconPress={onTogglePassword}
        secureTextEntry={!passwordVisible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={15}
        value={password}
        editable={!loading}
        onChangeText={onChangePassword}
      />
      <AppTextInput
        accessibilityLabel="Confirm new password"
        placeholder="Confirm New Password"
        leftIcon="lock-closed-outline"
        rightIcon={confirmVisible ? 'eye-off-outline' : 'eye-outline'}
        rightIconLabel={confirmVisible ? 'Hide confirmed password' : 'Show confirmed password'}
        onRightIconPress={onToggleConfirm}
        secureTextEntry={!confirmVisible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={15}
        value={confirmPassword}
        editable={!loading}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        onChangeText={onChangeConfirm}
      />
      <View style={[styles.rules, { backgroundColor: theme.colors.primarySoft }]}>
        {rules.map((rule) => (
          <View key={rule.label} style={styles.ruleRow}>
            <Ionicons name={rule.valid ? 'checkmark-circle' : 'ellipse-outline'} size={17} color={rule.valid ? green : theme.colors.textSoft} />
            <Text style={[styles.ruleText, { color: rule.valid ? theme.colors.text : theme.colors.textMuted }]}>{rule.label}</Text>
          </View>
        ))}
      </View>
      {error ? <Text accessibilityRole="alert" style={[styles.formError, { color: theme.colors.danger }]}>{error}</Text> : null}
      <AppButton
        title={loading ? 'Updating...' : 'Reset Password'}
        icon="arrow-forward"
        iconPosition="right"
        onPress={onSubmit}
        disabled={loading}
        style={[styles.primaryButton, { backgroundColor: green, borderColor: green }]}
        textStyle={styles.whiteText}
      />
    </View>
  );
}

function SuccessStep({ green, onLogin, theme }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.successStep}>
      <ResetHeroIcon icon="checkmark" color={green} theme={theme} success />
      <AccentTitle before="Password" accent="Updated!" color={theme.colors.text} green={green} centered />
      <Text style={[styles.description, styles.centerText, { color: theme.colors.textMuted }]}>Your password has been changed successfully. You can now log in using your new password.</Text>
      <AppButton
        title="Go to Login"
        icon="arrow-forward"
        iconPosition="right"
        onPress={onLogin}
        style={[styles.primaryButton, styles.successButton, { backgroundColor: green, borderColor: green }]}
        textStyle={styles.whiteText}
      />
    </View>
  );
}

function AccentTitle({ accent, before, centered = false, color, green }) {
  return (
    <Text accessibilityRole="header" style={[styles.title, centered && styles.centerText, { color }]}>
      {before} <Text style={{ color: green }}>{accent}</Text>
    </Text>
  );
}

function ResetHeroIcon({ color, compact = false, icon, success = false, theme }) {
  const size = compact ? 100 : 132;
  return (
    <View style={[styles.heroIcon, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.primarySoft }]}>
      <View style={[success && styles.successCore, success && { backgroundColor: color }]}>
        <Ionicons name={icon} size={compact ? 50 : success ? 72 : 64} color={success ? '#FFFFFF' : color} />
      </View>
    </View>
  );
}

function BackButton({ color, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onPress} hitSlop={8} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={color} />
    </Pressable>
  );
}

function maskEmail(email) {
  const [local = '', domain = ''] = String(email || '').split('@');
  if (!domain) return email || 'your email address';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, Math.min(7, local.length - visible.length)))}@${domain}`;
}

function clearResetUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.history?.replaceState) return;
  window.history.replaceState({}, '', window.location.pathname);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 18, paddingBottom: 24 },
  centeredContent: { justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 440, minHeight: '100%', alignSelf: 'center' },
  emailStep: { flex: 1, justifyContent: 'center' },
  stepBody: { flex: 1, paddingTop: 4 },
  brand: { marginBottom: 30 },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '900', letterSpacing: 0, marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 23, marginBottom: 24, maxWidth: 360 },
  emphasis: { fontWeight: '800' },
  primaryButton: { minHeight: 54, borderRadius: 28 },
  whiteText: { color: '#FFFFFF' },
  loginBack: { alignSelf: 'center', marginTop: 22, minHeight: 48 },
  backButton: { width: 44, height: 44, marginLeft: -10, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  successCore: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 3, borderRadius: 8, padding: 13, marginBottom: 20 },
  noticeText: { flex: 1, marginLeft: 10, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  resendRow: { minHeight: 54, marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },
  resendLabel: { fontSize: 13, fontWeight: '600' },
  resendButton: { minHeight: 44, justifyContent: 'center' },
  resendLink: { fontSize: 13, fontWeight: '900' },
  loadingStep: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spinner: { marginTop: 8 },
  rules: { borderRadius: 8, padding: 13, marginTop: -2, marginBottom: 16 },
  ruleRow: { minHeight: 25, flexDirection: 'row', alignItems: 'center' },
  ruleText: { marginLeft: 8, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  formError: { fontSize: 12, lineHeight: 18, fontWeight: '800', marginBottom: 12 },
  successStep: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successButton: { width: '100%', marginTop: 26 },
  centerText: { textAlign: 'center', alignSelf: 'center' },
});
