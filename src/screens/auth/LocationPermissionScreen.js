import React, { useState } from 'react';
import { completeTravelerOnboarding } from '../../services/authService';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import MapPlaceholder from '../../components/MapPlaceholder';
import Screen from '../../components/Screen';
import { requestLocationAccess } from '../../services/locationAccess';
import { setRecordingConsent } from '../../services/automaticVisitService';

export default function LocationPermissionScreen({ navigation, route }) {
  const { theme, setLocationPermission, automaticVisits } = useApp();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const finish = async (choice) => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      if (choice === 'allowed' && await requestLocationAccess() !== 'granted') {
        await setRecordingConsent(false);
        throw new Error('Location access is unavailable. Enable location access in your device or browser settings, then try again. You can also skip.');
      }
      // Permission alone is not consent: the button explicitly authorizes recording.
      await setRecordingConsent(choice === 'allowed');
      await completeTravelerOnboarding(choice);
      setLocationPermission(choice);
      automaticVisits.retryPermission();
      if (route?.params?.returnToPrevious && navigation.canGoBack()) navigation.goBack();
      else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (cause) { setError(cause.message || 'Unable to save your choice. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Auth', { screen: 'Login' }))} />
      <Text style={[styles.title, { color: theme.colors.text }]}>Your Location Matters</Text>
      <MapPlaceholder showHeatmap={false} showControls={false} showMarkers={false} largePin style={styles.map} />
      <AppCard style={styles.privacyCard}>
        <View style={[styles.privacyIcon, { backgroundColor: theme.colors.primarySoft }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.privacyText}>
          <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>Automatically save your visits</Text>
          <Text style={[styles.privacyCopy, { color: theme.colors.textMuted }]}>
            With your consent, GPS confirms visits to registered Naga destinations while the app is open. We privately save your account ID, destination, date and time. No check-in button or two-hour stay is needed.
          </Text>
        </View>
      </AppCard>
      <AppCard style={styles.privacyCard}>
        <View style={[styles.privacyIcon, { backgroundColor: theme.colors.primarySoft }]}>
          <Ionicons name="lock-closed-outline" size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.privacyText}>
          <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>Exact location stays private</Text>
          <Text style={[styles.privacyCopy, { color: theme.colors.textMuted }]}>GPS readings stay on your device. The heatmap shares only visit totals, never your movement history. You can turn recording off in Data Sharing settings.</Text>
        </View>
      </AppCard>
      {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{error}</Text> : null}
      <AppButton title={saving ? 'Saving...' : 'Allow Location & Save Visits'} disabled={saving} icon="navigate-outline" onPress={() => finish('allowed')} style={styles.button} />
      <AppButton title="Skip" disabled={saving} variant="outline" onPress={() => finish('skipped')} style={styles.skipButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 30,
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
  },
  map: {
    marginTop: 28,
    marginBottom: 18,
    aspectRatio: 1.08,
  },
  privacyCard: {
    marginTop: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  privacyCopy: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  button: {
    marginTop: 24,
  },
  skipButton: {
    marginTop: 10,
  },
});
