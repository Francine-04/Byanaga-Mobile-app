import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { destinationPhotos, photoCategories } from '../../data/destinationExtras';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import PlaceholderImage from '../../components/PlaceholderImage';
import Screen from '../../components/Screen';

export default function DestinationPhotosScreen({ navigation, route }) {
  const { theme } = useApp();
  const [category, setCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const photos = route.params?.destination?.photos || destinationPhotos;
  const filtered = photos.filter((photo) => category === 'All' || photo.category === category);
  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Photos" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <View style={styles.filters}>
        {photoCategories.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityLabel={item}
          aria-pressed={category === item} accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)}
          style={[styles.filter, { backgroundColor: category === item ? theme.colors.primary : theme.colors.surface, borderColor: category === item ? theme.colors.primary : theme.colors.border }]}>
          <Text style={[styles.filterLabel, { color: category === item ? theme.colors.onPrimary : theme.colors.text }]}>{item}</Text>
        </Pressable>)}
      </View>
      <View style={styles.grid}>
        {filtered.map((photo) => (
          <Pressable key={photo.id} accessibilityRole={photo.image ? 'button' : undefined} accessibilityLabel={photo.image ? 'Open ' + photo.category + ' photo' : undefined}
            disabled={!photo.image} onPress={() => setSelectedPhoto(photo)} style={styles.tile}>
            <PlaceholderImage image={photo.image} label={photo.category + ' photo placeholder'} aspectRatio={1} iconSize={36} />
          </Pressable>
        ))}
      </View>
      <Modal visible={!!selectedPhoto} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
        <View style={[styles.viewer, { backgroundColor: theme.colors.background }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={() => setSelectedPhoto(null)} style={styles.close}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
          {selectedPhoto ? <PlaceholderImage image={selectedPhoto.image} label={selectedPhoto.category} aspectRatio={1} style={styles.largePhoto} /> : null}
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>{selectedPhoto?.category}</Text>
        </View>
      </Modal>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: 8 }, filters: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  filter: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 22, paddingHorizontal: 3 },
  filterLabel: { fontSize: 11, lineHeight: 17, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tile: { width: '30%', flexGrow: 1, flexBasis: '30%', maxWidth: '32%', aspectRatio: 1 },
  viewer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }, close: { position: 'absolute', top: 56, right: 20, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  largePhoto: { maxWidth: 520 }, caption: { marginTop: 20, fontSize: 14 },
});
