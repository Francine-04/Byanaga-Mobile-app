import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import Screen from '../../components/Screen';
import SettingsRow from '../../components/SettingsRow';
import { signOutTraveler } from '../../services/authService';
import { clearRememberedTraveler } from '../../services/rememberMeService';

export default function SettingsScreen({ navigation }) {
  const { theme, themePreference, setThemePreference, settings, setSettings, storageError, isGuestMode, setIsGuestMode, setIsLoggedIn } = useApp();
  const toggle = (field) => (value) => setSettings((current) => ({ ...current, [field]: value }));

  const goToLogin = async () => {
    try {
      await clearRememberedTraveler();
    } catch {
      // Continue to the login screen even if local storage cleanup is unavailable.
    } finally {
      setIsGuestMode(false);
      setIsLoggedIn(false);
    }
    navigation.reset({ index: 0, routes: [{ name: 'Auth', params: { screen: 'Login' } }] });
  };

  const logout = async () => {
    try {
      await clearRememberedTraveler();
      await signOutTraveler();
    } catch {
      await clearRememberedTraveler();
    } finally {
      setIsGuestMode(false);
      setIsLoggedIn(false);
    }
    navigation.reset({ index: 0, routes: [{ name: 'Auth', params: { screen: 'Login' } }] });
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Settings" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <Section title="Appearance">
        <SettingsRow icon="sunny-outline" label="Light Mode" selected={themePreference === 'light'} onPress={() => setThemePreference('light')} />
        <SettingsRow icon="moon-outline" label="Dark Mode" selected={themePreference === 'dark'} onPress={() => setThemePreference('dark')} />
        <SettingsRow icon="phone-portrait-outline" label="Follow System" selected={themePreference === 'system'} onPress={() => setThemePreference('system')} last />
      </Section>
      <Section title="Notifications">
        <SettingsRow icon="notifications-outline" label="Travel Alerts" value={settings.travelAlerts} onToggle={toggle('travelAlerts')} />
        <SettingsRow icon="calendar-outline" label="Events" value={settings.eventUpdates} onToggle={toggle('eventUpdates')} />
        <SettingsRow icon="partly-sunny-outline" label="Weather Updates" value={settings.weatherUpdates} onToggle={toggle('weatherUpdates')} />
        <SettingsRow icon="pricetag-outline" label="Promotions" value={settings.promotions} onToggle={toggle('promotions')} last />
      </Section>
      <Section title="Privacy">
        <SettingsRow icon="location-outline" label="Anonymous Location" value={settings.anonymousLocation} onToggle={toggle('anonymousLocation')} />
        <SettingsRow icon="shield-checkmark-outline" label="Data Sharing Preferences" onPress={() => navigation.navigate('PrivacySettings')} last />
      </Section>
      <Section title="Preferred Language">
        <SettingsRow icon="language-outline" label="English" selected={settings.language === 'English'} onPress={() => toggle('language')('English')} />
        <SettingsRow icon="language-outline" label="Filipino" selected={settings.language === 'Filipino'} onPress={() => toggle('language')('Filipino')} last />
      </Section>
      <View style={styles.help}>
        <SettingsRow icon="call-outline" label="Emergency Contacts" onPress={() => navigation.navigate('EmergencyContacts')} last />
      </View>
      {storageError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{storageError}</Text> : null}
      <AppButton
        title={isGuestMode ? 'Login' : 'Log Out'}
        icon={isGuestMode ? 'log-in-outline' : undefined}
        variant={isGuestMode ? 'primary' : 'outline'}
        onPress={isGuestMode ? goToLogin : logout}
        style={isGuestMode ? styles.authAction : [styles.authAction, { borderColor: theme.colors.danger }]}
        textStyle={isGuestMode ? undefined : { color: theme.colors.danger }}
      />
    </Screen>
  );
}

function Section({ title, children }) {
  const { theme } = useApp();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={[styles.rows, { borderColor: theme.colors.border }]}>{children}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: 8 }, section: { marginBottom: 18 }, sectionTitle: { fontSize: 14, lineHeight: 20, fontWeight: '700', marginBottom: 8 },
  rows: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' }, help: { marginBottom: 16 },
  authAction: { borderRadius: 16 }, error: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
});
