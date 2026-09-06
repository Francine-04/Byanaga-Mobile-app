import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getMapboxAccessToken, getMapboxStyleUrl } from '../services/mapboxService';
import { NAGA_CENTER, isValidCoordinate } from '../utils/nagaBoundary';

let Mapbox = null;
let mapboxLoadError = null;

try {
  const mapboxModule = require('@rnmapbox/maps');
  Mapbox = mapboxModule.default || mapboxModule;
} catch (error) {
  mapboxLoadError = error;
}

export default function MapboxLocationPreview({ place, height = 220, style }) {
  const { theme } = useApp();
  const [mapError, setMapError] = useState(null);
  const accessToken = getMapboxAccessToken();
  const hasPlace = isValidCoordinate(place?.latitude, place?.longitude);
  const coordinate = useMemo(
    () => [
      hasPlace ? Number(place.longitude) : NAGA_CENTER.longitude,
      hasPlace ? Number(place.latitude) : NAGA_CENTER.latitude,
    ],
    [hasPlace, place?.latitude, place?.longitude]
  );

  if (Mapbox?.setAccessToken && accessToken) {
    Mapbox.setAccessToken(accessToken);
  }

  if (!Mapbox?.MapView || !Mapbox?.Camera || !Mapbox?.PointAnnotation) {
    return (
      <MapFallback
        height={height}
        style={style}
        message="Mapbox is not available in this app build. Rebuild the Expo development client after installing @rnmapbox/maps."
        place={place}
      />
    );
  }

  if (!accessToken || mapError || mapboxLoadError) {
    return (
      <MapFallback
        height={height}
        style={style}
        message={mapError || 'Mapbox token is unavailable. Check EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.'}
        place={place}
      />
    );
  }

  return (
    <View style={[styles.card, { height, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }, style]}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={getMapboxStyleUrl()}
        logoEnabled
        compassEnabled={false}
        attributionEnabled
        onDidFailLoadingMap={() => setMapError('Mapbox map could not load. Please check your connection and token.')}
      >
        <Mapbox.Camera centerCoordinate={coordinate} zoomLevel={hasPlace ? 15 : 12} animationDuration={650} />
        {hasPlace ? (
          <Mapbox.PointAnnotation id={String(place.placeId || place.id || 'selected-place')} coordinate={coordinate}>
            <View style={[styles.marker, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </View>
          </Mapbox.PointAnnotation>
        ) : null}
      </Mapbox.MapView>
      <View style={[styles.caption, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.captionText, { color: theme.colors.text }]} numberOfLines={1}>
          {hasPlace ? place.name : 'Centered on Naga City'}
        </Text>
      </View>
    </View>
  );
}

function MapFallback({ height, style, message, place }) {
  const { theme } = useApp();

  return (
    <View style={[styles.card, styles.fallback, { height, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }, style]}>
      <Ionicons name="map-outline" size={34} color={theme.colors.primary} />
      <Text style={[styles.fallbackTitle, { color: theme.colors.text }]}>
        {place?.name || 'Naga City map preview'}
      </Text>
      <Text style={[styles.fallbackText, { color: theme.colors.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  caption: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  captionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  fallbackTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  fallbackText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
