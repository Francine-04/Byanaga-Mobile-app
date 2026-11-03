import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import DeviceModal from './DeviceModal';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { suppliedFoodPhotos } from '../utils/suppliedPlaceImages';
import PlaceholderImage from './PlaceholderImage';

// Dish photos are not venue photos and do not imply a restaurant serves a dish.
export default function LocalFoodGallery() {
  const { theme } = useApp();
  const [selected, setSelected] = useState(null);
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Food photo gallery</Text>
      <Text style={[styles.note, { color: theme.colors.textMuted }]}>Explore these dishes. Ask each restaurant what’s on its menu.</Text>
      <FlatList horizontal data={suppliedFoodPhotos} keyExtractor={(photo) => photo.id}
        showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable style={styles.tile} accessibilityRole="button" accessibilityLabel={`View ${item.name}`} onPress={() => setSelected(item)}>
            <PlaceholderImage image={item.image} label={item.name} aspectRatio={1.3} resizeMode="cover" />
            <Text style={[styles.caption, { color: theme.colors.text }]} numberOfLines={2}>{item.name}</Text>
          </Pressable>
        )} />
      <DeviceModal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.viewer, { backgroundColor: theme.colors.surface }]}>
            <Pressable style={styles.close} accessibilityRole="button" accessibilityLabel="Close food photo" onPress={() => setSelected(null)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
            {selected ? <PlaceholderImage image={selected.image} label={selected.name} aspectRatio={1} resizeMode="contain" /> : null}
            <Text style={[styles.caption, { color: theme.colors.text }]}>{selected?.name}</Text>
          </View>
        </View>
      </DeviceModal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20, marginBottom: 16 }, title: { fontSize: 18, fontWeight: '800' },
  note: { fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 12 },
  row: { gap: 12 }, tile: { width: 150 }, caption: { fontSize: 13, lineHeight: 18, marginTop: 6, textTransform: 'capitalize' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  viewer: { width: '100%', maxWidth: 520, padding: 16, borderRadius: 18 },
  close: { width: 44, height: 44, alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center' },
});
