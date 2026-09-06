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
  const { theme, destinations } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [filtersVisible, setFiltersVisible] = useState(true);
  const categories = useMemo(
    () => ['All', ...Array.from(new Set([...defaultCategories.filter((item) => item !== 'All'), ...destinations.map((item) => item.category).filter(Boolean)]))],
    [destinations]
  );
  const filtered = useMemo(() => destinations.filter((destination) =>
    (category === 'All' || destination.category === category) &&
    destination.name.toLowerCase().includes(query.trim().toLowerCase())), [category, destinations, query]);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList data={filtered} keyExtractor={(item) => item.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}
        ListHeaderComponent={<View>
          <AppHeader centered title="Explore" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" rightIcon="options-outline"
            rightLabel="Toggle destination filters" onRightPress={() => setFiltersVisible((current) => !current)} />
          <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
            <TextInput accessibilityLabel="Search destinations" value={query} onChangeText={setQuery} placeholder="Search destinations..."
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
          onPress={() => navigation.navigate('DestinationDetails', { destination: item })} />}
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
