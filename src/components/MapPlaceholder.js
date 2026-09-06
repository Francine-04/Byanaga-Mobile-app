import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import HeatmapOverlay from './HeatmapOverlay';

const defaultMarkers = [
  { id: 'm1', name: 'Basilica', top: '19%', left: '58%' },
  { id: 'm2', name: 'Museum', top: '35%', left: '28%' },
  { id: 'm3', name: 'Park', top: '63%', left: '20%' },
  { id: 'm4', name: 'Plaza', top: '55%', left: '58%' },
];

export default function MapPlaceholder({
  zones,
  markers = defaultMarkers,
  selectedZoneId,
  onSelectZone,
  showHeatmap = true,
  showControls = true,
  showMarkers = true,
  largePin = false,
  style,
}) {
  const { theme } = useApp();

  return (
    <View style={[styles.map, { backgroundColor: theme.dark ? '#162238' : '#EDF7F2', borderColor: theme.colors.border }, style]}>
      <View style={[styles.water, { backgroundColor: theme.dark ? '#173D5E' : '#BDEBFF' }]} />
      <Road top="16%" left="-10%" width="124%" rotate="-14deg" color={theme.dark ? '#41536B' : '#D5DED9'} />
      <Road top="39%" left="-8%" width="118%" rotate="22deg" color={theme.dark ? '#41536B' : '#D5DED9'} />
      <Road top="62%" left="-6%" width="112%" rotate="-7deg" color={theme.dark ? '#41536B' : '#D5DED9'} />
      <Road top="8%" left="45%" width="96%" rotate="86deg" color={theme.dark ? '#41536B' : '#D5DED9'} />
      <View style={[styles.park, { backgroundColor: theme.dark ? '#173C2A' : '#D8F2DF' }]} />
      <View style={[styles.district, { borderColor: theme.colors.border }]} />
      {showHeatmap ? <HeatmapOverlay zones={zones} selectedZoneId={selectedZoneId} onSelectZone={onSelectZone} /> : null}
      <Text style={[styles.cityLabel, { color: theme.colors.text }]}>Naga City</Text>
      {largePin ? (
        <View style={styles.largePinWrap}>
          <View style={[styles.largePinShadow, { backgroundColor: `${theme.colors.primary}22` }]} />
          <View style={[styles.largePin, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.largePinHole} />
          </View>
        </View>
      ) : null}
      {showMarkers
        ? markers.map((marker) => (
            <View key={marker.id} style={[styles.marker, { top: marker.top, left: marker.left }]}>
              <View style={[styles.pin, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="location" size={14} color="#FFFFFF" />
              </View>
              <Text style={[styles.markerText, { color: theme.colors.text }]}>{marker.name}</Text>
            </View>
          ))
        : null}
      {showControls ? (
        <View style={styles.controls}>
          <MapControl icon="eye-outline" />
          <MapControl icon="add" />
          <MapControl icon="remove" />
        </View>
      ) : null}
    </View>
  );
}

function Road({ top, left, width, rotate, color }) {
  return <View style={[styles.road, { top, left, width, backgroundColor: color, transform: [{ rotate }] }]} />;
}

function MapControl({ icon, primary }) {
  const { theme } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Map ${icon}`}
      style={[styles.control, { backgroundColor: primary ? theme.colors.primary : theme.colors.surface }]}
    >
      <Ionicons name={icon} size={18} color={primary ? '#FFFFFF' : theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    aspectRatio: 0.82,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  water: {
    position: 'absolute',
    width: '118%',
    height: 34,
    top: '44%',
    left: '-12%',
    borderRadius: 999,
    transform: [{ rotate: '-28deg' }],
    opacity: 0.75,
  },
  road: {
    position: 'absolute',
    height: 8,
    borderRadius: 999,
    opacity: 0.95,
  },
  park: {
    position: 'absolute',
    left: '8%',
    bottom: '10%',
    width: '33%',
    height: '24%',
    borderRadius: 28,
    opacity: 0.9,
  },
  district: {
    position: 'absolute',
    right: '8%',
    top: '10%',
    width: '30%',
    height: '22%',
    borderWidth: 1,
    borderRadius: 18,
    opacity: 0.8,
  },
  cityLabel: {
    position: 'absolute',
    top: '47%',
    alignSelf: 'center',
    fontSize: 22,
    fontWeight: '900',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerText: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '800',
  },
  largePinWrap: {
    position: 'absolute',
    top: '26%',
    alignSelf: 'center',
    width: 108,
    height: 130,
    alignItems: 'center',
  },
  largePinShadow: {
    position: 'absolute',
    bottom: 2,
    width: 86,
    height: 24,
    borderRadius: 43,
  },
  largePin: {
    width: 76,
    height: 92,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    borderBottomLeftRadius: 38,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  largePinHole: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
  controls: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    gap: 8,
  },
  control: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
