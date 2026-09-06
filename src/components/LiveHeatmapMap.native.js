import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
} catch (error) {
  mapboxLoadError = error;
}

export default function LiveHeatmapMap({ zones = [], markers = [], selectedZoneId, onSelectZone, style }) {
  const { theme } = useApp();
  const [mapError, setMapError] = useState(null);
  const accessToken = getMapboxAccessToken();
  const selectedCenter = useMemo(() => getSelectedZoneLngLat(zones, selectedZoneId), [selectedZoneId, zones]);
  const featureCollection = useMemo(
    () => heatZonesToFeatureCollection(zones, (zone) => getZoneColor(theme, zone.colorKey)),
    [theme, zones]
  );

  if (Mapbox?.setAccessToken && accessToken) {
    Mapbox.setAccessToken(accessToken);
  }

  if (
    !Mapbox?.MapView ||
    !Mapbox?.Camera ||
    !Mapbox?.ShapeSource ||
    !Mapbox?.CircleLayer ||
    !accessToken ||
    mapError ||
    mapboxLoadError
  ) {
    return (
      <MapPlaceholder
        zones={zones}
        markers={markers}
        selectedZoneId={selectedZoneId}
        onSelectZone={onSelectZone}
        style={style}
      />
    );
  }

  return (
    <View style={[styles.map, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }, style]}>
      <Mapbox.MapView
        style={styles.mapFill}
        styleURL={getMapboxStyleUrl()}
        attributionEnabled
        logoEnabled
        compassEnabled={false}
        onDidFailLoadingMap={() => setMapError('Live map could not load. Please check your connection and Mapbox token.')}
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
      <View style={[styles.badge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
        <Text style={[styles.badgeText, { color: theme.colors.text }]}>Live Naga map</Text>
      </View>
    </View>
  );
}

function getZoneColor(theme, colorKey) {
  return theme.crowd[colorKey] || theme.crowd.moderate;
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
});
