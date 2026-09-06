import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { smartItineraryStops } from '../../data/itineraries';
import { optimizeRoute } from '../../utils/routeOptimization';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import Screen from '../../components/Screen';
import TimelineItem from '../../components/TimelineItem';

export default function SmartItineraryScreen({ navigation }) {
  const { theme, destinations, restaurants } = useApp();
  const stops = useMemo(() => {
    const suggestedStops = [
      destinations[0] ? toTimelineStop(destinations[0], '8:00 AM') : null,
      destinations[1] ? toTimelineStop(destinations[1], '9:45 AM') : null,
      restaurants[0] ? {
        id: `lunch-${restaurants[0].id}`,
        time: '12:00 PM',
        title: restaurants[0].name,
        subtitle: 'Lunch break',
        crowd: 'Moderate',
        image: null,
      } : null,
      destinations[2] ? toTimelineStop(destinations[2], '2:00 PM') : null,
    ].filter(Boolean);

    return optimizeRoute(suggestedStops.length ? suggestedStops : smartItineraryStops);
  }, [destinations, restaurants]);

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => goToDashboard(navigation)} rightIcon="information-circle-outline" rightLabel="Itinerary information" />
      <Text style={[styles.title, { color: theme.colors.text }]}>Smart Itinerary</Text>
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
        Powered by Preference Matching & Route Optimization
      </Text>
      <View style={styles.timeline}>
        {stops.map((stop, index) => (
          <TimelineItem key={stop.id} stop={stop} isLast={index === stops.length - 1} />
        ))}
      </View>
      <AppCard style={styles.summary}>
        <Metric label="Distance" value="12.6 km" />
        <Metric label="Est. Time" value="6.5 hrs" />
        <Metric label="Transport" value="Walking / Tricycle" />
      </AppCard>
      <View style={styles.actions}>
        <AppButton title="Customize" variant="outline" onPress={() => navigation.navigate('CreateItinerary')} style={styles.customize} />
        <AppButton title="Optimize Route" style={styles.optimize} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Download itinerary"
          style={[styles.iconAction, { borderColor: theme.colors.primary }]}
        >
          <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>
    </Screen>
  );
}

function toTimelineStop(destination, time) {
  return {
    id: `stop-${destination.id}`,
    time,
    title: destination.name,
    subtitle: destination.estimatedVisitTime || 'Suggested stop',
    crowd: destination.crowdLevel || 'Moderate',
    image: null,
  };
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
