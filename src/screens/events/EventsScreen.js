import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import EventCard from '../../components/EventCard';
import Screen from '../../components/Screen';
import OfflineState from '../../components/OfflineState';

export default function EventsScreen({ navigation }) {
  const { theme, tourismEvents, eventsSource, eventsError, isOffline } = useApp();
  const sourceLabel = eventsSource === 'dashboard' ? 'Live from tourism dashboard' : eventsSource === 'error' ? 'Connection unavailable' : 'Connecting to dashboard';

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
              {sourceLabel}
            </Text>
          </View>
        </View>
      </View>
      {tourismEvents.length ? tourismEvents.map((event) => (
        <EventCard key={event.id} event={event} compact showActions={false} style={styles.fullCard} />
      )) : (
        <EmptyState
          icon={eventsError ? 'cloud-offline-outline' : 'calendar-outline'}
          title={eventsSource === 'loading' ? 'Loading events' : eventsError ? 'Unable to load events' : 'No published upcoming events'}
          description={eventsError ? 'Check your connection and try again.' : 'Events published by the tourism officer will appear here.'}
          style={styles.empty}
        />
      )}
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
  fullCard: {
    width: '100%',
    marginBottom: 12,
  },
  empty: {
    minHeight: 360,
  },
});
