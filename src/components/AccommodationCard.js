import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import AppButton from './AppButton';
import AppCard from './AppCard';
import PlaceholderImage from './PlaceholderImage';
import Rating from './Rating';
import useBookmarkAction from '../hooks/useBookmarkAction';

export default function AccommodationCard({ accommodation, compact = false, showActions = true, onPress, style }) {
  const { theme, bookmarks } = useApp();
  const toggleBookmark = useBookmarkAction();
  const saved = bookmarks.includes(accommodation.id);

  return (
    <AppCard accessibilityLabel={`Open ${accommodation.name}`} onPress={onPress} style={[styles.card, compact && styles.compactCard, style]}>
      <PlaceholderImage
        image={accommodation.image}
        label="Accommodation placeholder"
        aspectRatio={compact ? 1.16 : 1.25}
        style={compact ? styles.compactImage : styles.image}
      />
      <View style={[styles.body, compact && styles.compactBody]}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {accommodation.name}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {accommodation.amenities}
        </Text>
        {!compact ? <Text style={[styles.cardPrice, { color: theme.colors.primary }]}>{accommodation.price}</Text> : null}
        <View style={styles.footer}>
          <Rating value={accommodation.rating} />
          {compact ? <Text style={[styles.distance, { color: theme.colors.textMuted }]}>{accommodation.distance}</Text> : null}
        </View>
        {showActions ? (
          <View style={styles.actions}>
            <AppButton title="Book" style={styles.smallButton} />
            <AppButton title="Directions" variant="secondary" style={styles.smallButton} />
          </View>
        ) : null}
      </View>
      {compact ? (
        <View style={styles.trailing}>
          <Text style={[styles.price, { color: theme.colors.text }]} numberOfLines={1}>
            {accommodation.price}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${accommodation.name}`} accessibilityState={{ selected: saved }} onPress={(event) => { event.stopPropagation(); toggleBookmark(accommodation.id); }} style={styles.bookmark}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? theme.colors.primary : theme.colors.text} />
          </Pressable>
        </View>
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
  price: {
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
  },
  cardPrice: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
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
  trailing: {
    minWidth: 74,
    alignItems: 'flex-end',
  },
  bookmark: {
    width: 44,
    height: 44,
    marginTop: 2,
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
    paddingHorizontal: 10,
  },
});
