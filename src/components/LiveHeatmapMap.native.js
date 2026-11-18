import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getMapboxAccessToken, getMapboxStyleUrl } from '../services/mapboxService';
import { NAGA_CENTER } from '../utils/nagaBoundary';
import { getSelectedZoneLngLat, heatZonesToFeatureCollection } from '../utils/heatmapMap';
import MapPlaceholder from './MapPlaceholder';

let Mapbox = null;
let mapboxLoadError = null;

try {
  const mapboxModule = require('@rnmapbox/maps');
  Mapbox = mapboxModule.default || mapboxModule;
  if (getMapboxAccessToken()) Mapbox.setAccessToken(getMapboxAccessToken());
} catch (error) {
  mapboxLoadError = error;
}

export default function LiveHeatmapMap({ zones = [], markers = [], selectedZoneId, onSelectZone, style }) {
  const { theme } = useApp();
  const [mapError, setMapError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [useBasicMap, setUseBasicMap] = useState(false);
  const accessToken = getMapboxAccessToken();
  const selectedCenter = useMemo(() => getSelectedZoneLngLat(zones, selectedZoneId), [selectedZoneId, zones]);
  const featureCollection = useMemo(
    () => heatZonesToFeatureCollection(zones, (zone) => getZoneColor(theme, zone.colorKey)),
    [theme, zones]
  );
  useEffect(() => {
    if (mapReady || mapError || !accessToken) return undefined;
    const timer = setTimeout(() => setMapError('Live map tiles did not appear. Check your connection and retry.'), 20000);
    return () => clearTimeout(timer);
  }, [mapAttempt, mapReady, mapError, accessToken]);

  if (
    !Mapbox?.MapView ||
    !Mapbox?.Camera ||
    !Mapbox?.ShapeSource ||
    !Mapbox?.CircleLayer ||
    !accessToken ||
    mapError ||
    mapboxLoadError ||
    useBasicMap
  ) {
    return (
      <View>
        <Text accessibilityRole="alert" style={{ color: theme.colors.danger, marginTop: 12, lineHeight: 20 }}>
          {useBasicMap ? 'Basic heatmap view. Tap a place to inspect its recorded visits.' : !accessToken ? 'Mapbox token is missing from this build.' : mapError || 'Mapbox requires a new native build, not Expo Go. The view below is a map preview.'}
        </Text>
        {mapError ? <Pressable accessibilityRole="button" accessibilityLabel="Retry map" onPress={() => { setMapReady(false); setMapError(null); setMapAttempt((attempt) => attempt + 1); }} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.primary }}>Retry Map</Text>
        </Pressable> : null}
        {useBasicMap && accessToken ? <Pressable accessibilityRole="button" accessibilityLabel="Try live map" onPress={() => { setMapReady(false); setMapError(null); setUseBasicMap(false); setMapAttempt((attempt) => attempt + 1); }} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.primary }}>Try live map</Text>
        </Pressable> : null}
        <MapPlaceholder
        zones={zones}
        markers={markers}
        selectedZoneId={selectedZoneId}
        onSelectZone={onSelectZone}
        showHeatmap
        showMarkers={false}
        style={style}
        />
      </View>
    );
  }

  return (
    <View style={[styles.map, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }, style]}>
      <Mapbox.MapView
        key={mapAttempt}
        style={styles.mapFill}
        styleURL={getMapboxStyleUrl()}
        attributionEnabled
        logoEnabled
        compassEnabled={false}
        onDidFailLoadingMap={() => setMapError('Live map could not load. Please check your connection and Mapbox token.')}
        onMapLoadingError={() => setMapError('Live map tiles could not load. Please check your connection and Mapbox token.')}
        onDidFinishRenderingMapFully={() => setMapReady(true)}
      >
        <Mapbox.Camera
          centerCoordinate={selectedZoneId ? selectedCenter : [NAGA_CENTER.longitude, NAGA_CENTER.latitude]}
          zoomLevel={selectedZoneId ? 13.2 : 12.4}
          animationDuration={650}
        />
        <Mapbox.ShapeSource
          id="byanaga-heat-zones"
          shape={featureCollection}
          onPress={(event) => {
            const zoneId = event?.features?.[0]?.properties?.id;
            const selectedZone = zones.find((zone) => zone.id === zoneId);
            if (selectedZone) {
              onSelectZone?.(selectedZone);
            }
          }}
        >
          <Mapbox.CircleLayer
            id="byanaga-heat-glow"
            style={{
              circleRadius: ['interpolate', ['linear'], ['get', 'size'], 72, 34, 120, 58],
              circleColor: ['get', 'color'],
              circleOpacity: 0.28,
              circleBlur: 0.68,
            }}
          />
          <Mapbox.CircleLayer
            id="byanaga-heat-selected"
            filter={['==', ['get', 'id'], selectedZoneId || '']}
            style={{
              circleRadius: 22,
              circleColor: '#FFFFFF',
              circleOpacity: 0.2,
              circleStrokeColor: ['get', 'color'],
              circleStrokeWidth: 3,
            }}
          />
          <Mapbox.CircleLayer
            id="byanaga-heat-centers"
            style={{
              circleRadius: 10,
              circleColor: ['get', 'color'],
              circleOpacity: 0.94,
              circleStrokeColor: '#FFFFFF',
              circleStrokeWidth: 3,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>
      {!mapReady && <View style={styles.preview} pointerEvents="none"><MapPlaceholder zones={zones} markers={markers} selectedZoneId={selectedZoneId} showHeatmap showMarkers={false} style={styles.previewMap} /></View>}
      <View style={[styles.badge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
        <Text style={[styles.badgeText, { color: theme.colors.text }]}>Live Naga map</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Use basic heatmap if the live map is black" onPress={() => setUseBasicMap(true)} style={[styles.basicButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Map black? Basic view</Text>
      </Pressable>
    </View>
  );
}

function getZoneColor(theme, colorKey) {
  return colorKey === 'unknown' ? theme.colors.textMuted : theme.crowd[colorKey] || theme.crowd.moderate;
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    aspectRatio: 0.82,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapFill: {
    flex: 1,
  },
  preview: { ...StyleSheet.absoluteFillObject },
  previewMap: { flex: 1, width: '100%' },
  badge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  basicButton: {
    position: 'absolute', right: 12, bottom: 12, minHeight: 34,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
