import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import AppHeader, { goBackToPrevious } from '../../components/AppHeader';
import Screen from '../../components/Screen';
import SettingsRow from '../../components/SettingsRow';
import { setRecordingConsent } from '../../services/automaticVisitService';

export default function PrivacySettingsScreen({ navigation }) {
  const { theme, settings, setSettings, automaticVisits, firebaseUser } = useApp();
  const [error, setError] = useState('');
  const changeRecording = async (enabled) => {
    setError('');
    if (!firebaseUser || firebaseUser.isAnonymous) { navigation.navigate('Auth', { screen: 'Login' }); return; }
    if (enabled) { navigation.navigate('LocationPermission', { returnToPrevious: true }); return; }
    automaticVisits.pauseRecording();
    try { await setRecordingConsent(false); }
    catch { setError('Recording is stopped on this device. Your account preference could not be saved; check your connection and try again.'); }
  };
  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Data Sharing" onBack={() => goBackToPrevious(navigation)} backLabel="Back to previous screen" />
      <SettingsRow icon="location-outline" label="Automatically save destination visits" value={automaticVisits.consent} onToggle={changeRecording} />
      <SettingsRow icon="shield-checkmark-outline" label="Share anonymous usage data" value={settings.dataSharing}
        onToggle={(dataSharing) => setSettings((current) => ({ ...current, dataSharing }))} last />
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>Automatic visits use GPS only while the app is open. Your visit records are private; the heatmap shows totals only. Turn this off at any time. General usage reporting remains inactive.</Text>
      {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{error}</Text> : null}
    </Screen>
  );
}
const styles = StyleSheet.create({ content: { paddingTop: 8 }, copy: { fontSize: 14, lineHeight: 23, marginTop: 20, paddingHorizontal: 12 } });
