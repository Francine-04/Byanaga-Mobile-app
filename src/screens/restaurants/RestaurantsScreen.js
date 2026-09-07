import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import CategoryChip from '../../components/CategoryChip';
import RestaurantCard from '../../components/RestaurantCard';
import Screen from '../../components/Screen';

export default function RestaurantsScreen({ navigation }) {
  const { theme, restaurants } = useApp();
  const [filter, setFilter] = useState('All');
  const filters = useMemo(
    () => ['All', ...Array.from(new Set(restaurants.map((restaurant) => restaurant.cuisine).filter(Boolean))).slice(0, 5)],
    [restaurants]
  );
  const filtered = useMemo(
    () => restaurants.filter((restaurant) => filter === 'All' || restaurant.cuisine === filter),
    [filter, restaurants]
  );

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => goToDashboard(navigation)} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Popular Restaurants</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Filter restaurants" style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={theme.colors.text} />
        </Pressable>
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
