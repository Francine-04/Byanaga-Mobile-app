import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { generateItinerary } from '../../utils/generateItinerary';
import { isTravelerAccessRequired, redirectToLogin } from '../../utils/guestAccess';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import Screen from '../../components/Screen';
import TimelineItem from '../../components/TimelineItem';
import TravelDateField from '../../components/TravelDateField';
import { manilaDate } from '../../utils/travelSchedule';

export default function SmartItineraryScreen({ navigation }) {
  const { theme, recommendationCatalog, travelerReady, backendErrors, preferences, weather, isGuestMode, firebaseUser, authReady } = useApp();
  const [travelDate, setTravelDate] = useState(manilaDate);
  const pending = recommendationCatalog.loading || (!isGuestMode && firebaseUser && !travelerReady && !backendErrors.auth);
  const loadError = recommendationCatalog.error || (!isGuestMode && backendErrors.auth);
  const suggestion = useMemo(() => pending || loadError ? { days: [], advice: '' } : generateItinerary({ ...recommendationCatalog, preferences: isGuestMode ? {} : preferences, weather, travelDate }), [recommendationCatalog, preferences, weather, isGuestMode, travelDate, pending, loadError]);
  const stops = suggestion.days.flatMap((day) => day.places);
  const customize = () => {
    if (isTravelerAccessRequired({ isGuestMode, firebaseUser, authReady })) {
      redirectToLogin(navigation);
      return;
    }
    navigation.navigate('CreateItinerary', { trip: { name: 'My Naga City Trip', travelDate, days: suggestion.days, recommendation: suggestion.recommendation } });
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => goToDashboard(navigation)} rightIcon="information-circle-outline" rightLabel="Itinerary information" />
      <Text style={[styles.title, { color: theme.colors.text }]}>Smart Itinerary</Text>
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
        Powered by Preference Matching & Route Optimization
      </Text>
      <TravelDateField value={travelDate} onChange={setTravelDate} style={{ marginTop: 16 }} />
      {pending ? <ActivityIndicator accessibilityLabel="Loading saved preferences and places" color={theme.colors.primary} /> : null}
      {loadError ? <Text accessibilityRole="alert" style={[styles.copy, { color: theme.colors.danger }]}>Unable to load your preferences or tourism places. {loadError}</Text> : null}
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>{suggestion.advice}</Text>
      <View style={styles.timeline}>
        {suggestion.days.map((day, dayIndex) => <View key={day.id}>
          <Text style={[styles.copy, { color: theme.colors.text }]}>Day {dayIndex + 1}</Text>
          {day.places.map((stop, index) => <TimelineItem key={stop.entryId} stop={stop} isLast={index === day.places.length - 1} />)}
        </View>)}
        {!pending && !loadError && !stops.length ? <Text style={{ color: theme.colors.text }}>No published Naga City places with valid locations are available for these dates.</Text> : null}
      </View>
      <AppCard style={styles.summary}>
        <Metric label="Places" value={String(stops.length)} />
        <Metric label="Days" value={String(suggestion.days.length)} />
        <Metric label="Schedule" value="Editable" />
      </AppCard>
      <View style={styles.actions}>
        <AppButton title="Customize & Save" onPress={customize} disabled={!stops.length} style={styles.customize} />
      </View>
    </Screen>
  );
}

function Metric({ label, value }) {
  const { theme } = useApp();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  copy: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  timeline: {
    marginTop: 18,
  },
  summary: {
    marginTop: 2,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  metricValue: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  customize: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  optimize: {
    flex: 1.35,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  iconAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
