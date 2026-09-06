import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import EventCard from '../../components/EventCard';
import Screen from '../../components/Screen';
import OfflineState from '../../components/OfflineState';

export default function EventsScreen({ navigation }) {
  const { theme, tourismEvents, eventsSource, eventsError, isOffline } = useApp();

  if (isOffline) return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <OfflineState />
    </Screen>
  );

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Upcoming Events</Text>
          <View style={[styles.sourcePill, { backgroundColor: theme.colors.primarySoft }]}>
            <Text style={[styles.sourceText, { color: theme.colors.primary }]}>
              {eventsSource === 'dashboard' ? 'Live from dashboard' : 'Sample events'}
            </Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="See all events" style={styles.textAction}>
          <Text style={[styles.textActionLabel, { color: theme.colors.textMuted }]}>See All</Text>
        </Pressable>
      </View>
      {eventsError ? <Text style={[styles.fallbackText, { color: theme.colors.textMuted }]}>Showing saved samples for now.</Text> : null}
      {tourismEvents.map((event) => (
        <EventCard key={event.id} event={event} compact showActions={false} style={styles.fullCard} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
  },
  header: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  sourcePill: {
    alignSelf: 'flex-start',
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 10,
    justifyContent: 'center',
    marginTop: 8,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '900',
  },
  fallbackText: {
    marginTop: -4,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '700',
  },
  textAction: {
    minHeight: 44,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textActionLabel: {
    fontSize: 11,
    fontWeight: '900',
  },
  fullCard: {
    width: '100%',
    marginBottom: 12,
  },
});
