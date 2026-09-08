import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { searchMapboxPlaces } from '../services/mapboxService';
import { assertInsideNagaCity } from '../utils/nagaBoundary';
import { mergeNagaPlaceResults, searchNagaCatalogPlaces } from '../utils/nagaPlaceCatalog';
import { resolveByanagaPlaceId } from '../utils/placeIdentity';
import AppButton from './AppButton';
import AppTextInput from './AppTextInput';
import CategoryChip from './CategoryChip';
import MapboxLocationPreview from './MapboxLocationPreview';
import PlaceholderImage from './PlaceholderImage';
import VisitTimeField from './VisitTimeField';
import { visitTimeFields } from '../utils/travelSchedule';

const filters = ['All', 'Nature', 'Church', 'Culture', 'Food', 'Shopping', 'Accommodation', 'Events'];

export default function DestinationSelectorModal({ visible, dayLabel, onClose, onAdd }) {
  const { theme, destinations, restaurants, accommodations, tourismEvents } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [results, setResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [visitTime, setVisitTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchRequest = useRef(0);

  const collections = useMemo(
    () => ({ destinations, restaurants, accommodations, events: tourismEvents }),
    [accommodations, destinations, restaurants, tourismEvents]
  );

  const runSearch = useCallback(async (nextCategory = category, nextQuery = query) => {
    const request = ++searchRequest.current;
    setLoading(true);
    setError(null);
    setSelectedPlace(null);

    const catalogPlaces = searchNagaCatalogPlaces({
      query: nextQuery,
      category: nextCategory,
      collections,
      limit: 30,
    });
    setResults(catalogPlaces);

    try {
      const mapboxPlaces = await searchMapboxPlaces({ query: nextQuery, category: nextCategory, limit: 20 });
      if (request !== searchRequest.current) return;
      const places = mergeNagaPlaceResults(catalogPlaces, mapboxPlaces, 30);
      setResults(places);
      if (!places.length) {
        setError('No Naga City places found for this category.');
      }
    } catch (searchError) {
      if (request !== searchRequest.current) return;
      const places = mergeNagaPlaceResults(catalogPlaces, 30);
      setResults(places);
      setError(searchError?.message || 'Unable to search Naga City places.');
    } finally {
      if (request === searchRequest.current) setLoading(false);
    }
  }, [category, collections, query]);

  useEffect(() => {
    if (!visible) {
      searchRequest.current++;
      setLoading(false);
      setQuery('');
      setCategory('All');
      setResults([]);
      setSelectedPlace(null);
      setVisitTime('');
      setError(null);
      return;
    }

    runSearch('All', '');
  }, [visible]);

  useEffect(() => () => { searchRequest.current++; }, []);

  const selectPlace = (place) => {
    try {
      assertInsideNagaCity(place);
      const byanagaPlaceId = resolveByanagaPlaceId(place, collections);
      setSelectedPlace({
        ...place,
        mapboxPlaceId: place.mapboxPlaceId || place.placeId,
        placeId: byanagaPlaceId || place.placeId || place.id,
      });
      setError(null);
    } catch (selectError) {
      setSelectedPlace(null);
      setError(selectError?.message || 'Selected location cannot be added.');
    }
  };

  const addSelectedPlace = () => {
    if (!selectedPlace || !visitTimeFields(visitTime)) {
      setError('Select a Naga City place and pick a visit time.');
      return;
    }

    onAdd({
      ...selectedPlace,
      ...visitTimeFields(visitTime),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close destination selector" onPress={onClose} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={21} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Add Place</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{dayLabel}</Text>
            </View>
            <View style={styles.iconButton} />
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <View style={styles.searchRow}>
                  <View style={styles.searchInput}>
                    <AppTextInput
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Search Naga City places..."
                      leftIcon="search-outline"
                      returnKeyType="search"
                      onSubmitEditing={() => runSearch()}
                      style={styles.noMargin}
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Search Naga City places"
                    onPress={() => runSearch()}
                    style={[styles.searchButton, { backgroundColor: theme.colors.primary }]}
                  >
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="search" size={20} color="#FFFFFF" />}
                  </Pressable>
                </View>

                <View style={styles.chips}>
                  {filters.map((filter) => (
                    <CategoryChip
                      key={filter}
                      label={filter}
                      selected={category === filter}
                      onPress={() => {
                        setCategory(filter);
                        setError(null);
                        runSearch(filter);
                      }}
                    />
                  ))}
                </View>

                <MapboxLocationPreview place={selectedPlace} height={190} style={styles.mapPreview} />

                {selectedPlace ? (
                  <View style={[styles.selectedCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Text style={[styles.selectedTitle, { color: theme.colors.text }]} numberOfLines={1}>
                      {selectedPlace.name}
                    </Text>
                    <Text style={[styles.selectedMeta, { color: theme.colors.textMuted }]} numberOfLines={2}>
                      {selectedPlace.address}
                    </Text>
                    <VisitTimeField value={visitTime} onChange={setVisitTime} style={styles.timeField} />
                    <AppButton title="Add to Itinerary" onPress={addSelectedPlace} disabled={!visitTime.trim()} />
                  </View>
                ) : null}

                {error ? (
                  <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger }]}>
                    <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
                    <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
                  </View>
                ) : null}

                <Text style={[styles.resultsLabel, { color: theme.colors.textMuted }]}>Naga City places by category</Text>
              </View>
            }
            renderItem={({ item }) => (
              <PlaceResult place={item} selected={selectedPlace?.id === item.id} onPress={() => selectPlace(item)} />
            )}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.empty}>
                  <Ionicons name="map-outline" size={30} color={theme.colors.textSoft} />
                  <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>Search by place name or browse a Naga City category.</Text>
                </View>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function PlaceResult({ place, selected, onPress }) {
  const { theme } = useApp();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${place.name}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.result,
        {
          backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <PlaceholderImage
        image={place.image}
        label={`${place.name} image`}
        aspectRatio={1}
        showIcon={false}
        style={styles.resultImage}
      />
      <View style={styles.resultBody}>
        <Text style={[styles.resultName, { color: theme.colors.text }]} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={[styles.resultMeta, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {place.address}
        </Text>
        <Text style={[styles.coordinates, { color: theme.colors.textSoft }]} numberOfLines={1}>
          {place.category} - {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
        </Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={21} color={theme.colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
  },
  noMargin: {
    marginBottom: 0,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mapPreview: {
    marginTop: 8,
  },
  selectedCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  selectedTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  selectedMeta: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  timeField: {
    marginTop: 14,
  },
  errorBox: {
    marginTop: 14,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  resultsLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  result: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultImage: {
    width: 56,
    height: 56,
    borderRadius: 15,
  },
  resultBody: {
    flex: 1,
    minWidth: 0,
  },
  resultName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  resultMeta: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  coordinates: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  empty: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '700',
  },
});
