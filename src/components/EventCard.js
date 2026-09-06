import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import AppButton from './AppButton';
import AppCard from './AppCard';
import PlaceholderImage from './PlaceholderImage';

export default function EventCard({ event, compact = false, showActions = true, style }) {
  const { theme } = useApp();

  return (
    <AppCard style={[styles.card, compact && styles.compactCard, style]}>
      <PlaceholderImage
        image={event.image}
        label="Event placeholder"
        aspectRatio={compact ? 1.16 : 1.25}
        style={compact ? styles.compactImage : styles.image}
      />
      <View style={[styles.body, compact && styles.compactBody]}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={compact ? 1 : 2}>
          {event.title}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {event.date}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {event.venue}
        </Text>
        {showActions ? (
          <View style={styles.actions}>
            <AppButton title="Bookmark" variant="outline" style={styles.smallButton} />
            <AppButton title="Join" style={styles.smallButton} />
            <AppButton title="Calendar" variant="secondary" style={styles.smallButton} />
          </View>
        ) : null}
      </View>
      {compact ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Bookmark ${event.title}`} style={styles.bookmark}>
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
