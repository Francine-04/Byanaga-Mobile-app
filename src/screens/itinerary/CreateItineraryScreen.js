import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import VisitTimeField from '../../components/VisitTimeField';
import { manilaDate, parseTravelDate, visitTimeFields } from '../../utils/travelSchedule';
import { isAuthRequiredError } from '../../services/authService';
import { generateItinerary } from '../../utils/generateItinerary';
import { findKnownPlace } from '../../data/nagaPlaces';
import { isTravelerAccessRequired, redirectToLogin } from '../../utils/guestAccess';
import {
  createDuplicateItineraryTitleError,
  DUPLICATE_ITINERARY_TITLE_CODE,
  findDuplicateItineraryTitle,
  normalizeItineraryTitle,
} from '../../utils/itineraryTitle';

export default function CreateItineraryScreen({ navigation, route }) {
  const { theme, destinations, recommendationCatalog, travelerReady, backendErrors, preferences, weather, isGuestMode, firebaseUser, authReady, savedTrips, saveItinerary } = useApp();
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [recommendation, setRecommendation] = useState(route.params?.trip?.recommendation || null);
  const [replacePending, setReplacePending] = useState(false);
  const savePending = useRef(false);
  const generate = (replace = false) => {
    if (accessRequired) { requestLogin(); return; }
    if (recommendationCatalog.loading || !travelerReady) { setFormError(backendErrors.auth || 'Please wait for your saved preferences and places to load.'); return; }
    if (recommendationCatalog.error) { setFormError(recommendationCatalog.error); return; }
    if (!parseTravelDate(travelDate)) { setFormError('Travel date must be a valid calendar date.'); return; }
    if (!replace && days.some((day) => day.places.length)) { setReplacePending(true); return; }
    setReplacePending(false);
    const result = generateItinerary({ ...recommendationCatalog, preferences, weather, travelDate });
    if (!result.days.length) { setFormError('No eligible Naga City places available. Please add places manually.'); return; }
    setDays(result.days);
    setTravelDate(result.travelDate);
    setRecommendation(result.recommendation);
    setSuggestionMessage(result.advice);
    setFormError(null);
  };
  const [tripId, setTripId] = useState(() => route.params?.trip?.id || null);
  const [tripName, setTripName] = useState(route.params?.trip?.name || 'My Naga City Trip');
  const [travelDate, setTravelDate] = useState(route.params?.trip?.travelDate || manilaDate());
  const [days, setDays] = useState(() => {
    if (route.params?.trip?.days?.length) return route.params.trip.days;
    return buildInitialDays(route.params?.place);
  });
  const [selectorDayId, setSelectorDayId] = useState(null);
  const [savingStatus, setSavingStatus] = useState(null);
  const [formError, setFormError] = useState(null);
  const [tripNameError, setTripNameError] = useState(null);
  const accessRequired = isTravelerAccessRequired({ isGuestMode, firebaseUser, authReady });

  const requestLogin = useCallback(() => {
    redirectToLogin(navigation);
  }, [navigation]);

  useEffect(() => {
    if (accessRequired) requestLogin();
  }, [accessRequired, requestLogin]);

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
              category: place.category,
              sourceCollection: place.sourceCollection,
              eventId: place.eventId || null,
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
    if (savePending.current) return;
    if (accessRequired) {
      requestLogin();
      return;
    }

    const cleanTripName = normalizeItineraryTitle(tripName);
    if (!cleanTripName) {
      setTripNameError('Trip name is required.');
      return;
    }
    if (findDuplicateItineraryTitle(savedTrips, cleanTripName, tripId)) {
      setTripNameError(createDuplicateItineraryTitleError(cleanTripName).message);
      return;
    }

    const cleanDate = travelDate.trim();
    if ((status !== 'Drafts' || cleanDate) && !parseTravelDate(cleanDate)) {
      setFormError('Travel date must use YYYY-MM-DD.');
      return;
    }
    if (status !== 'Drafts' && !days.some((day) => day.places.length)) { setFormError('Add at least one place before saving your trip.'); return; }

    savePending.current = true;
    setSavingStatus(status);
    setFormError(null);
    setTripNameError(null);

    try {
      const saved = await saveItinerary({
        itineraryId: tripId,
        tripName: cleanTripName,
        travelDate: cleanDate,
        status,
        days,
        recommendation,
      });
      setTripId(saved.id);
      goToMain(navigation, 'Trips', { status, updatedAt: Date.now() });
    } catch (error) {
      if (isAuthRequiredError(error)) {
        requestLogin();
        return;
      }
      if (error?.code === DUPLICATE_ITINERARY_TITLE_CODE) {
        setTripNameError(error.message);
        return;
      }
      setFormError(error?.message || 'Unable to save itinerary.');
    } finally {
      savePending.current = false;
      setSavingStatus(null);
    }
  };

  if (accessRequired) {
    return <View style={[styles.protectedScreen, { backgroundColor: theme.colors.background }]} />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen contentStyle={styles.content}>
        <AppHeader
          onBack={() => goToDashboard(navigation)}
          rightText={savingStatus === 'Upcoming' ? 'Saving' : 'Save'}
          onRightPress={() => saveTrip('Upcoming')}
        />
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Itinerary</Text>
        <AppTextInput
          label="Trip Name"
          value={tripName}
          onChangeText={(value) => {
            setTripName(value);
            setTripNameError(null);
          }}
          onBlur={() => {
            const cleanTripName = normalizeItineraryTitle(tripName);
            setTripName(cleanTripName);
            if (!cleanTripName) setTripNameError('Trip name is required.');
            else if (findDuplicateItineraryTitle(savedTrips, cleanTripName, tripId)) {
              setTripNameError(createDuplicateItineraryTitleError(cleanTripName).message);
            }
          }}
          error={tripNameError}
          autoCapitalize="words"
          maxLength={60}
          style={styles.firstField}
        />
        <TravelDateField value={travelDate} onChange={setTravelDate} error={formError?.includes('Travel date') ? formError : null} />
        <AppButton title="Generate Smart Itinerary" onPress={() => generate()} disabled={!!savingStatus} variant="outline" />
        {replacePending ? <View style={{ marginTop: 12, gap: 10 }}>
          <Text style={{ color: theme.colors.text }}>Replace the current stops with a new suggested itinerary?</Text>
          <AppButton title="Replace Stops" onPress={() => generate(true)} disabled={!!savingStatus} />
          <AppButton title="Keep Current Stops" variant="outline" onPress={() => setReplacePending(false)} />
        </View> : null}
        {suggestionMessage ? <Text style={{ color: theme.colors.textMuted, marginVertical: 12 }}>{suggestionMessage}</Text> : null}

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
                      onTimeChange={(value) => setDays((current) => current.map((item) => item.id !== day.id ? item : { ...item, places: item.places.map((stop, index) => index !== placeIndex ? stop : { ...stop, ...visitTimeFields(value), time: value }) }))}
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

function PlaceRow({ place, destinations, onDelete, onTimeChange }) {
  const { theme } = useApp();
  const destination = destinations.find((item) => item.id === place.destinationId || item.dashboardId === place.destinationId);
  const title = place.title || place.placeName || destination?.name || 'Add place';
  const meta = place.address || destination?.category || 'Naga City';

  return (
    <View style={styles.placeRow}>
      <VisitTimeField compact value={place.displayTime || place.time || ''} onChange={onTimeChange} style={{ width: 88 }} />
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
  const known = place ? findKnownPlace(place.name) : null;
  const places = place
    ? [
        {
          entryId: `place-${Date.now()}`,
          destinationId: place.dashboardId || place.id,
          placeId: place.dashboardId || place.id,
          title: place.name,
          placeName: place.name,
          address: place.address || 'Naga City',
          latitude: place.latitude ?? known?.latitude ?? null,
          longitude: place.longitude ?? known?.longitude ?? null,
          visitTime: '8:00 AM',
          displayTime: '8:00 AM',
          time: '8:00 AM',
          source: place.source || 'byanaga',
        },
      ]
    : [];

  return [{ id: 'day-1', open: true, places }];
}

const styles = StyleSheet.create({
  protectedScreen: {
    flex: 1,
  },
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
