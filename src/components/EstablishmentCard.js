import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import useBookmarkAction from '../hooks/useBookmarkAction';
import AppCard from './AppCard';
import PlaceholderImage from './PlaceholderImage';

export default function EstablishmentCard({ establishment, onPress, horizontal = false, showBookmark = true, style }) {
  const { theme, bookmarks } = useApp();
  const toggleBookmark = useBookmarkAction();
  const saved = bookmarks.includes(establishment.id);
  const updateCount = establishment.posts?.length || 0;
  const offerCount = establishment.vouchers?.length || 0;

  return (
    <AppCard
      accessibilityLabel={`Open ${establishment.name}`}
      onPress={onPress}
      style={[styles.card, horizontal && styles.horizontalCard, style]}
    >
      <PlaceholderImage
        image={establishment.image}
        label={`${establishment.name} photo`}
        aspectRatio={horizontal ? 1.15 : 1.55}
        style={horizontal ? styles.horizontalImage : styles.image}
      />
      <View style={[styles.body, horizontal && styles.horizontalBody]}>
        <View style={styles.eyebrowRow}>
          <View style={[styles.categoryIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Ionicons name={categoryIcon(establishment.category)} size={14} color={theme.colors.primary} />
          </View>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]} numberOfLines={1}>
            {establishment.categoryLabel}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: establishment.isOpen ? theme.colors.success : theme.colors.textSoft }]} />
          {showBookmark && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${establishment.name}`}
              accessibilityState={{ selected: saved }}
              onPress={(event) => {
                event.stopPropagation();
                toggleBookmark(establishment.id);
              }}
              style={styles.bookmarkButton}
            >
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? theme.colors.primary : theme.colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>{establishment.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
          <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>{establishment.address || 'Naga City'}</Text>
        </View>
        {(updateCount || offerCount) ? (
          <View style={styles.activityRow}>
            {updateCount ? <ActivityPill icon="megaphone-outline" label={`${updateCount} update${updateCount === 1 ? '' : 's'}`} /> : null}
            {offerCount ? <ActivityPill icon="pricetag-outline" label={`${offerCount} offer${offerCount === 1 ? '' : 's'}`} accent /> : null}
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSoft} style={styles.chevron} />
    </AppCard>
  );
}

function ActivityPill({ icon, label, accent = false }) {
  const { theme } = useApp();
  const color = accent ? theme.colors.accent : theme.colors.secondary;
  return (
    <View style={[styles.activityPill, { backgroundColor: accent ? theme.colors.accentSoft : theme.colors.secondarySoft }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.activityText, { color }]}>{label}</Text>
    </View>
  );
}

function categoryIcon(category) {
  if (category === 'restaurant') return 'restaurant-outline';
  if (['hotel', 'resort'].includes(category)) return 'bed-outline';
  if (category === 'shop') return 'storefront-outline';
  if (category === 'transport') return 'car-outline';
  return 'business-outline';
}

const styles = StyleSheet.create({
  card: {
    width: 246,
    marginRight: 14,
    marginBottom: 14,
  },
  horizontalCard: {
    width: '100%',
    minHeight: 126,
    marginRight: 0,
    padding: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  horizontalImage: {
    width: 94,
    borderRadius: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
    padding: 14,
  },
  horizontalBody: {
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 24,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    flex: 1,
    marginLeft: 7,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 6,
  },
  bookmarkButton: {
    marginLeft: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  metaRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    marginLeft: 5,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  activityRow: {
    marginTop: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activityPill: {
    minHeight: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityText: {
    marginLeft: 4,
    fontSize: 9,
    fontWeight: '900',
  },
  chevron: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -9,
  },
});
