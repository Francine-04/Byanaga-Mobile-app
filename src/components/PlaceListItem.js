import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import PlaceholderImage from './PlaceholderImage';

export default function PlaceListItem({ place, onPress, subtitle, showRating = true, travelTime }) {
  const { theme, bookmarks, toggleBookmark } = useApp();
  const saved = bookmarks.includes(place.id);
  return (
    <View style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + place.name} onPress={onPress} style={styles.main}>
        <PlaceholderImage image={place.image} label={place.name + ' photo placeholder'} aspectRatio={1} style={styles.photo} iconSize={32} />
        <View style={styles.body}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{place.name}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text> : null}
          <View style={styles.meta}>
            {showRating && place.rating ? <View style={styles.metric}><Ionicons name="star" size={12} color={theme.colors.accent} /><Text style={[styles.small, { color: theme.colors.text }]}>{place.rating}</Text></View> : null}
            <Text style={[styles.small, { color: theme.colors.textMuted }]}>{place.distance}</Text>
            {travelTime ? <View style={styles.metric}><Ionicons name="time-outline" size={12} color={theme.colors.textMuted} /><Text style={[styles.small, { color: theme.colors.textMuted }]}>{travelTime}</Text></View> : null}
          </View>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={(saved ? 'Unsave ' : 'Save ') + place.name} accessibilityState={{ selected: saved }}
        aria-pressed={saved}
        onPress={() => toggleBookmark(place.id)} style={styles.bookmark}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? theme.colors.primary : theme.colors.textMuted} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, marginBottom: 10, paddingLeft: 8 },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', minHeight: 90, paddingVertical: 8 },
  photo: { width: 64, borderRadius: 8 }, body: { flex: 1, minWidth: 0, marginLeft: 12, paddingVertical: 4 },
  name: { fontSize: 13, lineHeight: 19, fontWeight: '700' }, subtitle: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9, marginTop: 7 }, metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  small: { fontSize: 11, lineHeight: 16 }, bookmark: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginTop: 4 },
});
