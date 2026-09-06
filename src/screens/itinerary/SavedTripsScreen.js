import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { emptyStates } from '../../data/emptyStates';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import PlaceholderImage from '../../components/PlaceholderImage';
import Screen from '../../components/Screen';
import SelectionSheet from '../../components/SelectionSheet';

const tabs = ['Upcoming', 'Completed', 'Drafts'];
export default function SavedTripsScreen({ navigation, route }) {
  const { theme, savedTrips, deleteItinerary, updateItineraryStatus, itineraryError } = useApp();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [actionError, setActionError] = useState(null);
  useEffect(() => { if (tabs.includes(route.params?.status)) setActiveTab(route.params.status); }, [route.params?.status, route.params?.updatedAt]);
  const filtered = savedTrips.filter((trip) => trip.status === activeTab);
  const chooseAction = async (action) => {
    if (!selectedTrip) return;
    setActionError(null);

    try {
      if (action === 'Open trip') navigation.navigate('CreateItinerary', { trip: selectedTrip });
      if (action === 'Mark completed') {
        await updateItineraryStatus(selectedTrip.id, 'Completed');
        setActiveTab('Completed');
      }
      if (action === 'Delete trip') await deleteItinerary(selectedTrip.id);
      setSelectedTrip(null);
    } catch (error) {
      setActionError(error?.message || 'Unable to update this trip.');
    }
  };
  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Saved Trips" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      {actionError || itineraryError ? (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger }]}>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{actionError || itineraryError}</Text>
        </View>
      ) : null}
      {savedTrips.length ? <View style={styles.tabs}>
        {tabs.map((tab) => <Pressable key={tab} accessibilityRole="tab" accessibilityLabel={tab} accessibilityState={{ selected: activeTab === tab }} onPress={() => setActiveTab(tab)}
          aria-selected={activeTab === tab}
          style={[styles.segment, { backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.surface, borderColor: activeTab === tab ? theme.colors.primary : theme.colors.border }]}>
          <Text style={[styles.segmentText, { color: activeTab === tab ? theme.colors.onPrimary : theme.colors.text }]}>{tab}</Text>
        </Pressable>)}
      </View> : null}
      {filtered.length ? filtered.map((trip) => <View key={trip.id} style={[styles.trip, { borderBottomColor: theme.colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + trip.name} onPress={() => navigation.navigate('CreateItinerary', { trip })} style={styles.tripMain}>
          <PlaceholderImage image={trip.image} label="Trip photo placeholder" aspectRatio={1} style={styles.photo} />
          <View style={styles.body}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{trip.name}</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{trip.date}</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{trip.places} places</Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Options for ' + trip.name} onPress={() => setSelectedTrip(trip)} style={styles.more}>
          <Ionicons name="ellipsis-vertical" size={19} color={theme.colors.text} />
        </Pressable>
      </View>) : <EmptyState {...emptyStates.savedTrips} title={savedTrips.length ? 'No ' + activeTab.toLowerCase() + ' trips' : emptyStates.savedTrips.title}
        icon="bag-handle-outline" onPress={() => navigation.navigate('Explore')} />}
      <AppButton title="Create New Trip" icon="add" onPress={() => navigation.navigate('CreateItinerary')} variant={filtered.length ? 'primary' : 'ghost'} style={styles.create} />
      <SelectionSheet visible={!!selectedTrip} title={selectedTrip?.name || 'Trip options'}
        options={selectedTrip?.status === 'Completed' ? ['Open trip', 'Delete trip'] : ['Open trip', 'Mark completed', 'Delete trip']}
        onSelect={chooseAction} onClose={() => setSelectedTrip(null)} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: 8 }, tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  errorBox: { minHeight: 44, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14, justifyContent: 'center' },
  errorText: { fontSize: 12, lineHeight: 18, fontWeight: '800' },
  segment: { flex: 1, minHeight: 44, paddingHorizontal: 6, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 12, lineHeight: 18, fontWeight: '600' }, trip: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 14 },
  tripMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14 }, photo: { width: 72, borderRadius: 8 }, body: { flex: 1 },
  name: { fontSize: 14, lineHeight: 21, fontWeight: '700' }, meta: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  more: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' }, create: { marginTop: 24, borderRadius: 16 },
});
