import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import PlaceholderImage from './PlaceholderImage';

export default function TimelineItem({ stop, isLast = false }) {
  const { theme } = useApp();
  const crowdColor = getCrowdColor(theme, stop.crowd);
  const actionIcon = stop.title.toLowerCase().includes('restaurant') ? 'restaurant-outline' : 'bookmark-outline';

  return (
    <View style={styles.row}>
      <Text style={[styles.time, { color: theme.colors.text }]}>{stop.time}</Text>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: crowdColor, borderColor: theme.colors.surface }]} />
        {!isLast ? <View style={[styles.line, { backgroundColor: theme.colors.border }]} /> : null}
      </View>
      <View style={styles.stopRow}>
        <PlaceholderImage image={stop.image} label="Stop placeholder" aspectRatio={1.18} style={styles.image} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {stop.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {stop.subtitle}
          </Text>
        </View>
        <Ionicons name={actionIcon} size={20} color={theme.colors.text} />
      </View>
    </View>
  );
}

function getCrowdColor(theme, label) {
  const value = String(label || '').toLowerCase();
  if (value.includes('low')) return theme.crowd.low;
  if (value.includes('busy')) return theme.crowd.busy;
  if (value.includes('crowded')) return theme.crowd.crowded;
  return theme.crowd.moderate;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: 76,
  },
  time: {
    width: 68,
    fontSize: 12,
    fontWeight: '900',
    paddingTop: 13,
  },
  timeline: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 15,
    zIndex: 2,
  },
  line: {
    width: 2,
    flex: 1,
  },
  stopRow: {
    flex: 1,
    minHeight: 62,
    paddingVertical: 7,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 54,
    borderRadius: 10,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },
});
