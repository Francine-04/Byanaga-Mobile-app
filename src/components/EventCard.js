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
        label={`${event.title} event photo`}
        aspectRatio={compact ? 1.16 : 1.55}
        style={compact ? styles.compactImage : styles.image}
      />
      <View style={[styles.body, compact && styles.compactBody]}>
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>WHAT</Text>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={compact ? 1 : 2}>
          {event.what || event.title}
        </Text>
        {event.description ? <Text style={[styles.description, { color: theme.colors.textMuted }]} numberOfLines={compact ? 1 : 2}>{event.description}</Text> : null}
        <EventDetail icon="calendar-outline" label="WHEN" value={event.when || event.date} compact={compact} />
        <EventDetail icon="location-outline" label="WHERE" value={event.where || event.venue} compact={compact} />
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

function EventDetail({ icon, label, value, compact }) {
  const { theme } = useApp();
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color={theme.colors.primary} style={styles.detailIcon} />
      <View style={styles.detailCopy}>
        <Text style={[styles.detailLabel, compact && styles.compactDetailLabel, { color: theme.colors.textSoft }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.colors.textMuted }]} numberOfLines={compact ? 1 : 2}>{value || 'To be announced'}</Text>
      </View>
    </View>
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
    lineHeight: 20,
    fontWeight: '800',
  },
  eyebrow: {
    marginBottom: 3,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '900',
  },
  description: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  detailRow: {
    marginTop: 8,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 20,
    marginTop: 1,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    marginBottom: 1,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '900',
  },
  compactDetailLabel: {
    fontSize: 7,
    lineHeight: 9,
  },
  detailValue: {
    fontSize: 10,
    lineHeight: 14,
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
