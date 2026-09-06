import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import MapPlaceholder from '../../components/MapPlaceholder';
import Screen from '../../components/Screen';

export default function LocationPermissionScreen({ navigation }) {
  const { theme, setLocationPermission } = useApp();

  const finish = (choice) => {
    setLocationPermission(choice);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
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
          <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>Anonymous heatmaps</Text>
          <Text style={[styles.privacyCopy, { color: theme.colors.textMuted }]}>
            Your location is collected anonymously to improve tourism heatmaps.
          </Text>
        </View>
      </AppCard>
      <AppCard style={styles.privacyCard}>
        <View style={[styles.privacyIcon, { backgroundColor: theme.colors.primarySoft }]}>
          <Ionicons name="lock-closed-outline" size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.privacyText}>
          <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>Exact location stays private</Text>
          <Text style={[styles.privacyCopy, { color: theme.colors.textMuted }]}>We never display your exact location.</Text>
        </View>
      </AppCard>
      <AppButton title="Allow Location" icon="navigate-outline" onPress={() => finish('allowed')} style={styles.button} />
      <AppButton title="Skip" variant="outline" onPress={() => finish('skipped')} style={styles.skipButton} />
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
