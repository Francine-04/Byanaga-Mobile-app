import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import CategoryChip from '../../components/CategoryChip';
import RestaurantCard from '../../components/RestaurantCard';
import Screen from '../../components/Screen';

export default function RestaurantsScreen({ navigation }) {
  const { theme, restaurants } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const filters = useMemo(
    () => ['All', ...Array.from(new Set(restaurants.map((restaurant) => restaurant.cuisine).filter(Boolean))).slice(0, 5)],
    [restaurants]
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const matchesFilter = filter === 'All' || restaurant.cuisine === filter;
      const searchable = [restaurant.name, restaurant.cuisine, restaurant.description, restaurant.address].join(' ').toLowerCase();
      return matchesFilter && (!needle || searchable.includes(needle));
    });
  }, [filter, restaurants, query]);

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => goToDashboard(navigation)} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Popular Restaurants</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Filter restaurants" style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>
      <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
        <TextInput
          accessibilityLabel="Search restaurants"
          value={query}
          onChangeText={setQuery}
          placeholder="Search restaurants..."
          placeholderTextColor={theme.colors.textSoft}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: theme.colors.text }]}
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}>
            <Ionicons name="close-circle" size={19} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.filters}>
        {filters.map((item) => (
          <CategoryChip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>
      {filtered.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          compact
          showActions={false}
          style={styles.fullCard}
          onPress={restaurant.dashboardId ? () => navigation.navigate('EstablishmentDetails', { establishmentId: restaurant.dashboardId }) : undefined}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  search: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: { 
    flex: 1, 
    minWidth: 0, 
    minHeight: 46, 
    marginLeft: 9, 
    fontSize: 13, 
    paddingVertical: 10 
  },
  clear: { 
    width: 44, 
    height: 44, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  fullCard: {
    width: '100%',
    marginBottom: 12,
  },
});
