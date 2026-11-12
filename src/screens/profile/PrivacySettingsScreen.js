import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import Screen from '../../components/Screen';
import SettingsRow from '../../components/SettingsRow';

export default function PrivacySettingsScreen({ navigation }) {
  const { theme, settings, setSettings } = useApp();
  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Data Sharing" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <SettingsRow icon="shield-checkmark-outline" label="Share anonymous usage data" value={settings.dataSharing}
        onToggle={(dataSharing) => setSettings((current) => ({ ...current, dataSharing }))} last />
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>Your choice is saved on this device. Usage reporting and location collection are not active.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({ content: { paddingTop: 8 }, copy: { fontSize: 14, lineHeight: 23, marginTop: 20, paddingHorizontal: 12 } });
