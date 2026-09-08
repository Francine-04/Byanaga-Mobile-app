import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AccommodationCard from '../../components/AccommodationCard';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import CategoryChip from '../../components/CategoryChip';
import Screen from '../../components/Screen';

export default function AccommodationsScreen({ navigation }) {
  const { theme, accommodations } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const filters = useMemo(() => {
    const types = accommodations.map((item) => item.typeLabel || item.type).filter(Boolean);
    return ['All', ...Array.from(new Set(types)).slice(0, 4), 'Budget'];
  }, [accommodations]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return accommodations.filter((item) => {
      let matchesFilter = false;
      if (filter === 'All') {
        matchesFilter = true;
      } else if (filter === 'Budget') {
        matchesFilter = String(item.price || '').toLowerCase().includes('budget') || item.name.includes('Sancho');
      } else {
        matchesFilter = String(item.typeLabel || item.type || item.name).toLowerCase().includes(filter.toLowerCase());
      }
      
      const searchable = [item.name, item.typeLabel, item.type, item.description, item.address, item.price].join(' ').toLowerCase();
      return matchesFilter && (!needle || searchable.includes(needle));
    });
  }, [accommodations, filter, query]);

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => goToDashboard(navigation)} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Hotels & Stays</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Filter accommodations" style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>
      <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
        <TextInput
          accessibilityLabel="Search accommodations"
          value={query}
          onChangeText={setQuery}
          placeholder="Search hotels & stays..."
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
      {filtered.map((accommodation) => (
        <AccommodationCard
          key={accommodation.id}
          accommodation={accommodation}
          compact
          showActions={false}
          style={styles.fullCard}
          onPress={() => accommodation.sourceCollection === 'business_profiles' ? navigation.navigate('EstablishmentDetails', { establishmentId: accommodation.dashboardId }) : navigation.navigate('DestinationDetails', { destination: accommodation })}
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
