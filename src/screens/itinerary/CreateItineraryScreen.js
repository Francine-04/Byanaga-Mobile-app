import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard, goToMain } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppTextInput from '../../components/AppTextInput';
import DestinationSelectorModal from '../../components/DestinationSelectorModal';
import Screen from '../../components/Screen';
import TravelDateField from '../../components/TravelDateField';
import { isAuthRequiredError } from '../../services/authService';

export default function CreateItineraryScreen({ navigation, route }) {
  const { theme, destinations, firebaseUser, saveItinerary, setIsGuestMode, setIsLoggedIn } = useApp();
  const [tripId] = useState(() => route.params?.trip?.id || `trip-${Date.now()}`);
  const [tripName, setTripName] = useState(route.params?.trip?.name || 'My Naga City Trip');
  const [travelDate, setTravelDate] = useState(route.params?.trip?.travelDate || route.params?.trip?.date || '');
  const [days, setDays] = useState(() => {
    if (route.params?.trip?.days?.length) return route.params.trip.days;
    return buildInitialDays(route.params?.place);
  });
  const [selectorDayId, setSelectorDayId] = useState(null);
  const [savingStatus, setSavingStatus] = useState(null);
  const [formError, setFormError] = useState(null);

  const selectedDayLabel = useMemo(() => {
    const dayIndex = days.findIndex((day) => day.id === selectorDayId);
    return dayIndex >= 0 ? `Day ${dayIndex + 1}` : 'Day 1';
  }, [days, selectorDayId]);

  const openPlaceSelector = (dayId) => {
    setFormError(null);
    setSelectorDayId(dayId);
  };

  const addSelectedPlace = (place) => {
    const entryId = `place-${Date.now()}`;
    setDays((current) =>
      current.map((day) => {
        if (day.id !== selectorDayId) {
          return day;
        }

        return {
          ...day,
          open: true,
          places: [
            ...day.places,
            {
              entryId,
              placeId: place.placeId,
              destinationId: place.placeId,
              title: place.name,
              placeName: place.name,
              address: place.address,
              latitude: place.latitude,
              longitude: place.longitude,
              visitTime: place.visitTime,
              displayTime: place.displayTime,
              time: place.displayTime,
              source: place.source,
            },
          ],
        };
      })
    );
    setSelectorDayId(null);
  };

  const deletePlace = (dayId, placeIndex) => {
    setDays((current) =>
      current.map((day) => {
        if (day.id !== dayId) {
          return day;
        }
        return { ...day, places: day.places.filter((_, index) => index !== placeIndex) };
      })
    );
  };

  const addDay = () => {
    setDays((current) => [...current, { id: `day-${current.length + 1}`, open: true, places: [] }]);
  };

  const toggleDay = (dayId) => {
    setDays((current) => current.map((day) => (day.id === dayId ? { ...day, open: !day.open } : day)));
  };

  const saveTrip = async (status = 'Drafts') => {
    if (!firebaseUser || firebaseUser.isAnonymous) {
      setIsGuestMode(false);
      setIsLoggedIn(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth', params: { screen: 'Login', params: { message: 'Log in to save your itinerary.' } } }],
      });
      return;
    }

    const cleanDate = travelDate.trim();
    if (cleanDate && !isDateValue(cleanDate)) {
      setFormError('Travel date must use YYYY-MM-DD.');
      return;
    }

    setSavingStatus(status);
    setFormError(null);

    try {
      await saveItinerary({
        itineraryId: tripId,
        tripName,
        travelDate: cleanDate,
        status,
        days,
        existingCreatedAt: route.params?.trip?.createdAt,
      });
      goToMain(navigation, 'Trips', { status, updatedAt: Date.now() });
    } catch (error) {
      if (isAuthRequiredError(error)) {
        setIsGuestMode(false);
        setIsLoggedIn(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth', params: { screen: 'Login', params: { message: 'Log in to save your itinerary.' } } }],
        });
        return;
      }
      setFormError(error?.message || 'Unable to save itinerary.');
    } finally {
      setSavingStatus(null);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen contentStyle={styles.content}>
        <AppHeader
          onBack={() => goToDashboard(navigation)}
          rightText={savingStatus === 'Upcoming' ? 'Saving' : 'Save'}
          onRightPress={() => saveTrip('Upcoming')}
        />
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Itinerary</Text>
        <AppTextInput label="Trip Name" value={tripName} onChangeText={setTripName} style={styles.firstField} />
        <TravelDateField value={travelDate} onChange={setTravelDate} error={formError?.includes('Travel date') ? formError : null} />

        {formError && !formError.includes('Travel date') ? (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{formError}</Text>
          </View>
        ) : null}

        {days.map((day, dayIndex) => (
          <AppCard key={day.id} style={styles.dayCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Toggle day ${dayIndex + 1}`}
              onPress={() => toggleDay(day.id)}
              style={styles.dayHeader}
            >
              <Text style={[styles.dayTitle, { color: theme.colors.text }]}>Day {dayIndex + 1}</Text>
              <Ionicons name={day.open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.text} />
            </Pressable>
            {day.open ? (
              <View style={[styles.dayBody, { borderColor: theme.colors.border }]}>
                {day.places.length ? (
                  day.places.map((place, placeIndex) => (
                    <PlaceRow
                      key={place.entryId || `${day.id}-${placeIndex}`}
                      place={place}
                      destinations={destinations}
                      onDelete={() => deletePlace(day.id, placeIndex)}
                    />
                  ))
                ) : (
                  <Text style={[styles.emptyDay, { color: theme.colors.textMuted }]}>No places added yet.</Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Add place to day ${dayIndex + 1}`}
                  onPress={() => openPlaceSelector(day.id)}
                  style={styles.addPlace}
                >
                  <Ionicons name="add" size={18} color={theme.colors.primary} />
                  <Text style={[styles.addPlaceText, { color: theme.colors.primary }]}>Add Place</Text>
                </Pressable>
              </View>
            ) : null}
          </AppCard>
        ))}

        <Pressable accessibilityRole="button" accessibilityLabel="Add day" onPress={addDay} style={styles.addDay}>
          <Ionicons name="add" size={18} color={theme.colors.primary} />
          <Text style={[styles.addPlaceText, { color: theme.colors.primary }]}>Add Day</Text>
        </Pressable>

        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <AppButton
              title={savingStatus === 'Drafts' ? 'Saving' : 'Save Draft'}
              variant="outline"
              onPress={() => saveTrip('Drafts')}
              disabled={!!savingStatus}
              style={styles.action}
            />
          </View>
          <View style={{ flex: 1.55 }}>
            <AppButton
              title={savingStatus === 'Upcoming' ? 'Saving' : 'Save Trip'}
              onPress={() => saveTrip('Upcoming')}
              disabled={!!savingStatus}
              style={styles.actionPrimary}
            />
          </View>
        </View>
        {savingStatus ? (
          <View style={styles.savingRow}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.savingText, { color: theme.colors.textMuted }]}>Saving itinerary...</Text>
          </View>
        ) : null}
      </Screen>

      <DestinationSelectorModal
        visible={!!selectorDayId}
        dayLabel={selectedDayLabel}
        onClose={() => setSelectorDayId(null)}
        onAdd={addSelectedPlace}
      />
    </KeyboardAvoidingView>
  );
}

function PlaceRow({ place, destinations, onDelete }) {
  const { theme } = useApp();
  const destination = destinations.find((item) => item.id === place.destinationId || item.dashboardId === place.destinationId);
  const title = place.title || place.placeName || destination?.name || 'Add place';
  const meta = place.address || destination?.category || 'Naga City';

  return (
    <View style={styles.placeRow}>
      <View style={[styles.timePill, { backgroundColor: theme.colors.surfaceMuted }]}>
        <Text style={[styles.timeText, { color: theme.colors.text }]}>{place.displayTime || place.time || 'Time'}</Text>
      </View>
      <View style={styles.placeCopy}>
        <Text style={[styles.placeName, { color: theme.colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.placeMeta, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${title}`} onPress={onDelete} style={styles.deletePlace}>
        <Ionicons name="close" size={18} color={theme.colors.textMuted} />
      </Pressable>
    </View>
  );
}

function buildInitialDays(place) {
  const places = place
    ? [
        {
          entryId: `place-${Date.now()}`,
          destinationId: place.dashboardId || place.id,
          placeId: place.dashboardId || place.id,
          title: place.name,
          placeName: place.name,
          address: place.address || 'Naga City',
          latitude: place.latitude ?? null,
          longitude: place.longitude ?? null,
          visitTime: '8:00 AM',
          displayTime: '8:00 AM',
          time: '8:00 AM',
          source: place.source || 'byanaga',
        },
      ]
    : [];

  return [{ id: 'day-1', open: true, places }];
}

function isDateValue(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
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
  firstField: {
    marginTop: 16,
  },
  errorBox: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  dayCard: {
    padding: 0,
    marginTop: 14,
  },
  dayHeader: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  dayBody: {
    borderTopWidth: 1,
    padding: 12,
  },
  emptyDay: {
    paddingVertical: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timePill: {
    minWidth: 74,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  placeCopy: {
    flex: 1,
    minWidth: 0,
  },
  placeName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  placeMeta: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  deletePlace: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlace: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  addDay: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  addPlaceText: {
    fontSize: 13,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  action: {
    flex: 1,
    minHeight: 44,
  },
  actionPrimary: {
    flex: 1.55,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  savingRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  savingText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
