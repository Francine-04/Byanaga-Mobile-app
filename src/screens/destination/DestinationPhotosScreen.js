import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DeviceModal from '../../components/DeviceModal';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { destinationPhotos } from '../../data/destinationExtras';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import PlaceholderImage from '../../components/PlaceholderImage';
import Screen from '../../components/Screen';
import { suppliedPhotoCollection, withSuppliedPlaceImages } from '../../utils/suppliedPlaceImages';

export default function DestinationPhotosScreen({ navigation, route }) {
  const { theme } = useApp();
  const [category, setCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [limit, setLimit] = useState(30);
  const photos = route.params?.suppliedCollection ? suppliedPhotoCollection : withSuppliedPlaceImages(route.params?.destination)?.photos || destinationPhotos;
  const filters = ['All', ...new Set(photos.map((photo) => photo.category).filter(Boolean))];
  const filtered = photos.filter((photo) => category === 'All' || photo.category === category);
  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title={route.params?.suppliedCollection ? 'Photo collection' : 'Photos'} onBack={() => navigation.canGoBack() ? navigation.goBack() : goToDashboard(navigation)} backLabel="Back" />
      {route.params?.suppliedCollection ? <Text style={[styles.collectionNote, { color: theme.colors.textMuted }]}>Photos of places and food. Some places may not yet appear on the map.</Text> : null}
      <View style={styles.filters}>
        {filters.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityLabel={item}
          aria-pressed={category === item} accessibilityState={{ selected: category === item }} onPress={() => { setCategory(item); setLimit(30); }}
          style={[styles.filter, { backgroundColor: category === item ? theme.colors.primary : theme.colors.surface, borderColor: category === item ? theme.colors.primary : theme.colors.border }]}>
          <Text style={[styles.filterLabel, { color: category === item ? theme.colors.onPrimary : theme.colors.text }]}>{item}</Text>
        </Pressable>)}
      </View>
      <View style={styles.grid}>
        {filtered.slice(0, limit).map((photo) => (
          <Pressable key={photo.id} accessibilityRole={photo.image ? 'button' : undefined} accessibilityLabel={photo.image ? 'Open ' + (photo.caption || photo.category) + ' photo' : undefined}
            disabled={!photo.image} onPress={() => setSelectedPhoto(photo)} style={styles.tile}>
            <PlaceholderImage image={photo.image} label={photo.caption || photo.category} aspectRatio={1} resizeMode="cover" iconSize={36} />
            {photo.caption ? <Text style={[styles.tileCaption, { color: theme.colors.text }]} numberOfLines={3}>{photo.caption}</Text> : null}
          </Pressable>
        ))}
      </View>
      {filtered.length > limit ? <Pressable accessibilityRole="button" onPress={() => setLimit((value) => value + 30)} style={styles.more}><Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Show more photos</Text></Pressable> : null}
      <DeviceModal visible={!!selectedPhoto} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
        <View style={[styles.viewer, { backgroundColor: theme.colors.background }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={() => setSelectedPhoto(null)} style={styles.close}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
          {selectedPhoto ? <PlaceholderImage image={selectedPhoto.image} label={selectedPhoto.caption || selectedPhoto.category} resizeMode="contain" aspectRatio={1} style={styles.largePhoto} /> : null}
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>{selectedPhoto?.caption || selectedPhoto?.category}</Text>
        </View>
      </DeviceModal>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: 8 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  filter: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 22, paddingHorizontal: 12 },
  filterLabel: { fontSize: 11, lineHeight: 17, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tile: { width: '30%', flexGrow: 1, flexBasis: '30%', maxWidth: '32%' },
  tileCaption: { fontSize: 11, lineHeight: 15, marginTop: 5, marginBottom: 8 },
  collectionNote: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  more: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  viewer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }, close: { position: 'absolute', top: 56, right: 20, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  largePhoto: { maxWidth: 520 }, caption: { marginTop: 20, fontSize: 14 },
});
