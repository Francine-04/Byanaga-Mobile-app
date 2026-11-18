import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import Screen from '../../components/Screen';
import VoucherCard from '../../components/VoucherCard';
import { voucherBelongsToProfile } from '../../utils/establishmentContent';

export default function OffersScreen({ navigation, route }) {
  const { theme, vouchers, establishments, notificationError } = useApp();
  const requestedId = route.params?.voucherId;
  const [sortBy, setSortBy] = useState('newest'); // newest, expiring, discount, popular
  const [filterCategory, setFilterCategory] = useState('all');

  // Get unique categories from vouchers
  const categories = useMemo(() => {
    const cats = new Set();
    vouchers.forEach(v => {
      const establishment = establishments.find(e => voucherBelongsToProfile(v, e));
      if (establishment?.categoryLabel) cats.add(establishment.categoryLabel);
    });
    return ['all', ...Array.from(cats).sort()];
  }, [vouchers, establishments]);

  // Filter and sort vouchers
  const ordered = useMemo(() => {
    let filtered = [...vouchers];
    
    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(v => {
        const establishment = establishments.find(e => voucherBelongsToProfile(v, e));
        return establishment?.categoryLabel === filterCategory;
      });
    }

    // Sort vouchers
    filtered.sort((a, b) => {
      // Prioritize requested voucher
      if (a.id === requestedId) return -1;
      if (b.id === requestedId) return 1;

      switch (sortBy) {
        case 'expiring':
          // Soonest expiry first
          return (a.validUntil?.getTime?.() || 0) - (b.validUntil?.getTime?.() || 0);
        
        case 'discount':
          // Highest discount first
          const aValue = a.discountType === 'percentage' ? a.discountValue : 0;
          const bValue = b.discountType === 'percentage' ? b.discountValue : 0;
          return bValue - aValue;
        
        case 'popular':
          // Most claimed first
          return (b.claimCount || 0) - (a.claimCount || 0);
        
        case 'newest':
        default:
          // Newest first
          return (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0);
      }
    });

    return filtered;
  }, [vouchers, establishments, requestedId, sortBy, filterCategory]);

  const SortButton = ({ value, label, icon }) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        { backgroundColor: sortBy === value ? theme.colors.accent : theme.colors.card },
        { borderColor: sortBy === value ? theme.colors.accent : theme.colors.border }
      ]}
      onPress={() => setSortBy(value)}
    >
      <Ionicons 
        name={icon} 
        size={14} 
        color={sortBy === value ? '#FFFFFF' : theme.colors.textMuted} 
      />
      <Text style={[
        styles.sortButtonText,
        { color: sortBy === value ? '#FFFFFF' : theme.colors.text }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const CategoryChip = ({ category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        { backgroundColor: filterCategory === category ? theme.colors.primary : theme.colors.card },
        { borderColor: filterCategory === category ? theme.colors.primary : theme.colors.border }
      ]}
      onPress={() => setFilterCategory(category)}
    >
      <Text style={[
        styles.categoryChipText,
        { color: filterCategory === category ? '#FFFFFF' : theme.colors.text }
      ]}>
        {category === 'all' ? 'All Offers' : category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Offers" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      
      <View style={styles.header}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Available Vouchers</Text>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: theme.colors.accent }]}>{ordered.length} Active</Text>
        </View>
      </View>
      
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
        Approved offers from Naga City establishments.
      </Text>

      {notificationError && (
        <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>
          {notificationError}
        </Text>
      )}

      {/* Category Filters */}
      {categories.length > 1 && (
        <View style={styles.categoriesSection}>
          <Text style={[styles.filterLabel, { color: theme.colors.textMuted }]}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map(cat => (
              <CategoryChip key={cat} category={cat} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sort Options */}
      {ordered.length > 0 && (
        <View style={styles.sortSection}>
          <Text style={[styles.filterLabel, { color: theme.colors.textMuted }]}>Sort by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
            <SortButton value="newest" label="Newest" icon="time-outline" />
            <SortButton value="expiring" label="Expiring Soon" icon="hourglass-outline" />
            <SortButton value="discount" label="Best Discount" icon="trending-down-outline" />
            <SortButton value="popular" label="Popular" icon="flame-outline" />
          </ScrollView>
        </View>
      )}

      {/* Voucher List */}
      {ordered.length ? (
        <View style={styles.voucherList}>
          {ordered.map((voucher) => {
            const establishment = establishments.find((item) => item.dashboardId === voucher.establishmentId);
            return (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                showClaimButton={true}
                onPress={establishment ? () => navigation.navigate('EstablishmentDetails', { establishmentId: establishment.dashboardId }) : undefined}
              />
            );
          })}
        </View>
      ) : (
        <EmptyState
          icon="pricetag-outline"
          title={filterCategory === 'all' ? 'No active offers right now' : `No ${filterCategory} offers`}
          description="New approved vouchers will appear here when establishments publish them."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  heading: { fontSize: 20, lineHeight: 27, fontWeight: '900', flex: 1 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: { marginTop: 0, marginBottom: 18, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  error: { marginBottom: 12, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  
  categoriesSection: {
    marginBottom: 16,
  },
  sortSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  sortScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  voucherList: {
    marginTop: 8,
  },
});
