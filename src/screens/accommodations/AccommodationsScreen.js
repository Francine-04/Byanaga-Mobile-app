import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AccommodationCard from '../../components/AccommodationCard';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import CategoryChip from '../../components/CategoryChip';
import Screen from '../../components/Screen';

export default function AccommodationsScreen({ navigation }) {
  const { theme, accommodations } = useApp();
  const [filter, setFilter] = useState('All');
  const filters = useMemo(() => {
    const types = accommodations.map((item) => item.typeLabel || item.type).filter(Boolean);
    return ['All', ...Array.from(new Set(types)).slice(0, 4), 'Budget'];
  }, [accommodations]);
  const filtered = useMemo(
    () =>
      accommodations.filter((item) => {
        if (filter === 'All') return true;
        if (filter === 'Budget') return String(item.price || '').toLowerCase().includes('budget') || item.name.includes('Sancho');
        return String(item.typeLabel || item.type || item.name).toLowerCase().includes(filter.toLowerCase());
      }),
    [accommodations, filter]
  );

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => goToDashboard(navigation)} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Hotels & Stays</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Filter accommodations" style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={theme.colors.text} />
        </Pressable>
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
