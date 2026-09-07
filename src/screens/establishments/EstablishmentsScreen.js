import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import CategoryChip from '../../components/CategoryChip';
import EmptyState from '../../components/EmptyState';
import EstablishmentCard from '../../components/EstablishmentCard';
import Screen from '../../components/Screen';

const FILTERS = [
  { label: 'All', categories: null },
  { label: 'Dining', categories: ['restaurant'] },
  { label: 'Stays', categories: ['hotel', 'resort'] },
  { label: 'Attractions', categories: ['attraction', 'entertainment'] },
  { label: 'Shops', categories: ['shop'] },
];

export default function EstablishmentsScreen({ navigation }) {
  const { theme, establishments, backendErrors } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(FILTERS[0]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return establishments.filter((item) => {
      const matchesCategory = !filter.categories || filter.categories.includes(item.category);
      const searchable = [item.name, item.categoryLabel, item.address, ...item.services].join(' ').toLowerCase();
      return matchesCategory && (!needle || searchable.includes(needle));
    });
  }, [establishments, filter, query]);

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Establishments" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
        <TextInput
          accessibilityLabel="Search establishments"
          value={query}
          onChangeText={setQuery}
          placeholder="Search local establishments..."
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
        {FILTERS.map((item) => (
          <CategoryChip key={item.label} label={item.label} selected={filter.label === item.label} onPress={() => setFilter(item)} />
        ))}
      </View>
      {backendErrors.businessProfiles ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{backendErrors.businessProfiles}</Text> : null}
      {filtered.length ? filtered.map((establishment) => (
        <EstablishmentCard
          key={establishment.id}
          establishment={establishment}
          horizontal
          onPress={() => navigation.navigate('EstablishmentDetails', { establishmentId: establishment.dashboardId })}
        />
      )) : (
        <EmptyState
          icon="storefront-outline"
          title={establishments.length ? 'No matching establishments' : 'No published establishments yet'}
          description={establishments.length ? 'Try another search or category.' : 'Approved business profiles will appear here.'}
          buttonTitle={establishments.length ? 'Clear filters' : undefined}
          variant="outline"
          onPress={() => { setQuery(''); setFilter(FILTERS[0]); }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 10 },
  search: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, minWidth: 0, minHeight: 46, marginLeft: 9, fontSize: 13, paddingVertical: 10 },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { marginTop: 14, marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap' },
  error: { marginBottom: 12, fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
