import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import AppButton from './AppButton';
import AppCard from './AppCard';
import PlaceholderImage from './PlaceholderImage';
import Rating from './Rating';

export default function RestaurantCard({ restaurant, compact = false, showActions = true, onPress, style }) {
  const { theme } = useApp();

  return (
    <AppCard accessibilityLabel={`Open ${restaurant.name}`} onPress={onPress} style={[styles.card, compact && styles.compactCard, style]}>
      <PlaceholderImage
        image={restaurant.image}
        label="Restaurant placeholder"
        aspectRatio={compact ? 1.16 : 1.25}
        style={compact ? styles.compactImage : styles.image}
      />
      <View style={[styles.body, compact && styles.compactBody]}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {restaurant.cuisine}  -  {restaurant.priceRange}
        </Text>
        <View style={styles.footer}>
          <Rating value={restaurant.rating} />
          {compact ? <Text style={[styles.distance, { color: theme.colors.textMuted }]}>{restaurant.distance}</Text> : null}
        </View>
        {showActions ? (
          <View style={styles.actions}>
            <AppButton title="View Menu" variant="outline" style={styles.smallButton} />
            <AppButton title="Directions" variant="secondary" style={styles.smallButton} />
            <AppButton title="Save" style={styles.smallButton} />
          </View>
        ) : null}
      </View>
      {compact ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Save ${restaurant.name}`} style={styles.bookmark}>
          <Ionicons name="bookmark-outline" size={20} color={theme.colors.text} />
        </Pressable>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 218,
    marginRight: 14,
    marginBottom: 14,
  },
  compactCard: {
    width: '100%',
    padding: 10,
    marginRight: 0,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  compactImage: {
    width: 76,
    borderRadius: 12,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  compactBody: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    marginTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    fontSize: 11,
    fontWeight: '800',
  },
  bookmark: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 8,
  },
});
