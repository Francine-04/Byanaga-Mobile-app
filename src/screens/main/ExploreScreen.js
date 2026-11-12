import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { categories as defaultCategories } from '../../data/destinations';
import { emptyStates } from '../../data/emptyStates';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import CategoryChip from '../../components/CategoryChip';
import PlaceListItem from '../../components/PlaceListItem';
import EmptyState from '../../components/EmptyState';

export default function ExploreScreen({ navigation }) {
  const { theme, destinations, establishments } = useApp();
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
        originalData: est,
      };
    });
    
    console.log('📍 Total places (destinations + establishments):', destinationPlaces.length + establishmentPlaces.length);
    
    return [...destinationPlaces, ...establishmentPlaces];
  }, [destinations, establishments]);
  
  const categories = useMemo(
    () => ['All', ...Array.from(new Set([...defaultCategories.filter((item) => item !== 'All'), ...allPlaces.map((item) => item.category).filter(Boolean)]))],
    [allPlaces]
  );
  
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    console.log('🔎 Search query:', needle || '(empty)');
    console.log('📂 Selected category:', category);
    
    const results = allPlaces.filter((place) => {
      const matchesCategory = category === 'All' || place.category === category;
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
          <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
            <TextInput accessibilityLabel="Search places" value={query} onChangeText={setQuery} placeholder="Search destinations & places..."
              placeholderTextColor={theme.colors.textSoft} style={[styles.input, { color: theme.colors.text }]} autoCorrect={false} returnKeyType="search" />
            {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}>
              <Ionicons name="close-circle" size={19} color={theme.colors.textMuted} />
            </Pressable> : null}
          </View>
          {filtersVisible ? <View style={styles.categories}>
            {categories.map((item) => <CategoryChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}
          </View> : <View style={{ height: 16 }} />}
        </View>}
        renderItem={({ item }) => <PlaceListItem place={item} subtitle={item.category} travelTime={item.estimatedVisitTime}
          onPress={() => {
            if (item.sourceType === 'establishment') {
              navigation.navigate('EstablishmentDetails', { establishmentId: item.establishmentId });
            } else {
              navigation.navigate('DestinationDetails', { destination: item });
            }
          }} />}
        ListEmptyComponent={<EmptyState {...emptyStates.search} icon="search-outline" variant="outline" onPress={() => { setQuery(''); setCategory('All'); }} />}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 }, content: { flexGrow: 1, padding: 20, paddingTop: 8, paddingBottom: 24 },
  search: { minHeight: 48, borderRadius: 24, borderWidth: 1, paddingLeft: 16, paddingRight: 6, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minWidth: 0, minHeight: 46, marginLeft: 10, fontSize: 13, paddingVertical: 10 }, clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 16, paddingBottom: 12 },
});
