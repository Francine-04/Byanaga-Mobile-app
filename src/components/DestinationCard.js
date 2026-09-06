import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import AppCard from './AppCard';
import PlaceholderImage from './PlaceholderImage';
import Rating from './Rating';

export default function DestinationCard({
  destination,
  onPress,
  onBookmark,
  onQuickAdd,
  bookmarked = false,
  horizontal = false,
  compact = false,
  showQuickAdd = true,
}) {
  const { theme } = useApp();

  return (
    <AppCard
      style={[styles.card, horizontal ? styles.horizontalCard : compact ? styles.compactCard : styles.verticalCard]}
    >
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${destination.name}`} onPress={onPress} disabled={!onPress}>
        <PlaceholderImage
          image={destination.image}
          label="Destination Image"
          aspectRatio={horizontal || compact ? 1 : 1.4}
          style={horizontal ? styles.horizontalImage : [styles.verticalImage, compact && styles.compactImage]}
        />
      </Pressable>
      <View style={horizontal ? styles.horizontalBody : [styles.body, compact && styles.compactBody]}>
        <View style={styles.titleRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${destination.name}`}
            onPress={onPress}
            disabled={!onPress}
            style={styles.titleWrap}
          >
            <Text style={[styles.title, compact && styles.compactTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {destination.name}
            </Text>
            {!compact ? <Text style={[styles.category, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {destination.category}
            </Text> : null}
          </Pressable>
          {!compact ? <Pressable
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark destination'}
            onPress={onBookmark}
            style={[styles.bookmark, { backgroundColor: theme.colors.surfaceMuted }]}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={17}
              color={bookmarked ? theme.colors.primary : theme.colors.textMuted}
            />
          </Pressable> : null}
        </View>
        <View style={styles.metaRow}>
          <Rating value={destination.rating} />
          <Meta icon="navigate-outline" label={destination.distance} color={theme.colors.textMuted} />
          <Meta icon="time-outline" label={destination.estimatedVisitTime} color={theme.colors.textMuted} />
        </View>
        {showQuickAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${destination.name} to trip`}
            onPress={onQuickAdd}
            style={[styles.quickAdd, { backgroundColor: theme.colors.primarySoft }]}
          >
            <Ionicons name="add-circle-outline" size={15} color={theme.colors.primary} />
            <Text style={[styles.quickAddText, { color: theme.colors.primary }]}>Quick Add</Text>
          </Pressable>
        ) : null}
      </View>
      {compact ? <Pressable accessibilityRole="button" accessibilityLabel={(bookmarked ? 'Unsave ' : 'Save ') + destination.name}
        onPress={onBookmark} style={[styles.compactBookmark, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={theme.colors.primary} />
      </Pressable> : null}
    </AppCard>
  );
}

function Meta({ icon, label, color }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.metaText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  verticalCard: {
    width: 214,
    marginRight: 14,
  },
  compactCard: {
    width: 126,
    marginRight: 10,
  },
  horizontalCard: {
    flexDirection: 'row',
  },
  verticalImage: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  compactImage: {
    minHeight: 104,
  },
  horizontalImage: {
    width: 92,
    minHeight: 116,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  body: {
    padding: 14,
  },
  compactBody: {
    padding: 10,
  },
  horizontalBody: {
    flex: 1,
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  compactTitle: { fontSize: 12, lineHeight: 17, minHeight: 34, fontWeight: '700' },
  compactBookmark: { position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  category: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  bookmark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: '700',
  },
  quickAdd: {
    marginTop: 12,
    minHeight: 34,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '800',
  },
});
