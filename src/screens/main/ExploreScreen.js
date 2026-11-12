import React, { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { categories as defaultCategories } from '../../data/destinations';
import { emptyStates } from '../../data/emptyStates';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import CategoryChip from '../../components/CategoryChip';
import PlaceListItem from '../../components/PlaceListItem';
import EmptyState from '../../components/EmptyState';
import { dedupePlaces } from '../../utils/dedupePlaces';

export default function ExploreScreen({ navigation }) {
  const { theme, destinations, establishments, geoPlacesError } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [filtersVisible, setFiltersVisible] = useState(true);
  
  // Combine destinations and establishments for unified search
  const allPlaces = useMemo(() => {
    console.log('🔍 DEBUG: Total destinations:', destinations.length);
    console.log('🔍 DEBUG: Total establishments:', establishments.length);
    
    const destinationPlaces = destinations.map((dest) => ({
      ...dest,
      sourceType: 'destination',
    }));
    
    // Include ALL establishments in search (restaurants, hotels, attractions, shops, etc.)
    const establishmentPlaces = establishments.map((est) => {
      console.log('🏢 Establishment:', est.name, '| Category:', est.category, '| Label:', est.categoryLabel);
      return {
        id: `establishment-${est.id}`,
        name: est.name,
        category: est.categoryLabel || est.category,
        description: est.description || '',
        image: est.image,
        rating: est.rating || 4.5,
        address: est.address || '',
        estimatedVisitTime: 'See details',
        sourceType: 'establishment',
        establishmentId: est.dashboardId,
        latitude: est.latitude,
        longitude: est.longitude,
        originalData: est,
      };
    });
    
    console.log('📍 Total places (destinations + establishments):', destinationPlaces.length + establishmentPlaces.length);
    
    return dedupePlaces([...establishmentPlaces, ...destinationPlaces]);
  }, [destinations, establishments]);
  
  const categories = useMemo(
    () => ['All', ...Array.from(new Set([...defaultCategories, ...allPlaces.map((item) => item.category)]
      .filter((item) => item && item !== 'All' && item !== 'Events')))],
    [allPlaces]
  );
  
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    console.log('🔎 Search query:', needle || '(empty)');
    console.log('📂 Selected category:', category);
    
    const results = allPlaces.filter((place) => {
      const matchesCategory = category === 'All' || place.category === category || place.tags?.includes(category);
      const searchable = [place.name, place.category, place.description, place.address].join(' ').toLowerCase();
      const matchesSearch = !needle || searchable.includes(needle);
      
      if (needle && matchesSearch) {
        console.log('✅ Match found:', place.name, '| Type:', place.sourceType);
      }
      
      return matchesCategory && matchesSearch;
    });
    
    console.log('📊 Filtered results:', results.length);
    return results;
  }, [category, allPlaces, query]);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList data={filtered} keyExtractor={(item) => item.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}
        ListHeaderComponent={<View>
          <AppHeader centered title="Explore" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" rightIcon="options-outline"
            rightLabel="Toggle destination filters" onRightPress={() => setFiltersVisible((current) => !current)} />
          {geoPlacesError ? <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 10 }}>Geoapify places couldn’t load. Existing places are still available.</Text> : null}
          <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
            <TextInput accessibilityLabel="Search places" value={query} onChangeText={setQuery} placeholder="Search destinations & places..."
              placeholderTextColor={theme.colors.textSoft} style={[styles.input, { color: theme.colors.text }]} autoCorrect={false} returnKeyType="search" />
            {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}>
              <Ionicons name="close-circle" size={19} color={theme.colors.textMuted} />
            </Pressable> : null}
          </View>
          {filtersVisible ? <View style={styles.categories}>
            {categories.map((item) => <View key={item} style={styles.categoryCell}>
              <CategoryChip label={item} selected={category === item} onPress={() => setCategory(item)} style={styles.categoryChip} labelStyle={styles.categoryLabel} showSelectedIcon={false} labelLines={2} />
            </View>)}
          </View> : <View style={{ height: 16 }} />}
          <Pressable accessibilityRole="button" accessibilityLabel="Browse all supplied place and food photos"
            onPress={() => navigation.navigate('DestinationPhotos', { suppliedCollection: true })}
            style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <Ionicons name="images-outline" size={18} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>Browse photo collection</Text>
          </Pressable>
        </View>}
        renderItem={({ item }) => <PlaceListItem place={item} subtitle={item.category} travelTime={item.estimatedVisitTime}
          onPress={() => {
            if (item.sourceType === 'establishment') {
              navigation.navigate('EstablishmentDetails', { establishmentId: item.establishmentId });
            } else {
              navigation.navigate('DestinationDetails', { destination: item });
            }
          }} />}
        ListFooterComponent={filtered.some((place) => place.source === 'geoapify') ? <View style={{ paddingVertical: 12 }}><Text accessibilityRole="link" onPress={() => Linking.openURL('https://www.geoapify.com/')} style={{ color: theme.colors.textMuted, fontSize: 11 }}>Powered by Geoapify</Text><Text accessibilityRole="link" onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')} style={{ color: theme.colors.textMuted, fontSize: 11 }}>© OpenStreetMap contributors</Text></View> : null}
        ListEmptyComponent={<EmptyState {...emptyStates.search} icon="search-outline" variant="outline" onPress={() => { setQuery(''); setCategory('All'); }} />}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 }, content: { flexGrow: 1, padding: 20, paddingTop: 8, paddingBottom: 24 },
  search: { minHeight: 48, borderRadius: 24, borderWidth: 1, paddingLeft: 16, paddingRight: 6, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minWidth: 0, minHeight: 46, marginLeft: 10, fontSize: 13, paddingVertical: 10 }, clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3, paddingTop: 10, paddingBottom: 6 },
  categoryCell: { width: '25%', paddingHorizontal: 3, marginBottom: 6 },
  categoryChip: { width: '100%', minHeight: 34, height: 34, marginRight: 0, marginBottom: 0, paddingHorizontal: 4 },
  categoryLabel: { fontSize: 10, lineHeight: 12, fontWeight: '600' },
});
