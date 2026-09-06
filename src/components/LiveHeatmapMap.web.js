import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import mapboxgl from 'mapbox-gl';
import { useApp } from '../context/AppContext';
import { getMapboxAccessToken, getMapboxStyleUrl } from '../services/mapboxService';
import { NAGA_CENTER } from '../utils/nagaBoundary';
import { getSelectedZoneLngLat, heatZonesToFeatureCollection } from '../utils/heatmapMap';
import MapPlaceholder from './MapPlaceholder';

const MAPBOX_STYLE_ID = 'byanaga-mapbox-web-base-styles';
const SOURCE_ID = 'byanaga-heat-zones';
const GLOW_LAYER_ID = 'byanaga-heat-glow';
const CENTER_LAYER_ID = 'byanaga-heat-centers';
const SELECTED_LAYER_ID = 'byanaga-heat-selected';

export default function LiveHeatmapMap({ zones = [], markers = [], selectedZoneId, onSelectZone, style }) {
  const { theme } = useApp();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const accessToken = getMapboxAccessToken();
  const selectedCenter = useMemo(() => getSelectedZoneLngLat(zones, selectedZoneId), [selectedZoneId, zones]);
  const featureCollection = useMemo(
    () => heatZonesToFeatureCollection(zones, (zone) => getZoneColor(theme, zone.colorKey)),
    [theme, zones]
  );

  useEffect(() => {
    ensureMapboxBaseStyles();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !accessToken || mapRef.current || typeof window === 'undefined') {
      return undefined;
    }

    let resizeTimer = null;

    try {
      setMapError(null);
      setMapLoading(true);
      mapboxgl.accessToken = accessToken;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: getMapboxStyleUrl(),
        center: [NAGA_CENTER.longitude, NAGA_CENTER.latitude],
        zoom: 12.4,
        attributionControl: true,
        logoPosition: 'bottom-left',
      });

      mapRef.current = map;
      map.once('load', () => {
        addHeatmapLayers(map, featureCollection, selectedZoneId);
        attachZonePressHandlers(map, zones, onSelectZone);
        setMapLoading(false);
        map.resize();
      });
      map.on('error', () => {
        if (!map.loaded()) {
          setMapLoading(false);
          setMapError('Live map could not load. Please check your connection and Mapbox token.');
        }
      });

      resizeTimer = window.setTimeout(() => map.resize(), 120);
    } catch (error) {
      setMapLoading(false);
      setMapError('Live map could not load in this browser.');
    }

    return () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(SOURCE_ID);

    if (source?.setData) {
      source.setData(featureCollection);
    }

    if (map?.getLayer(SELECTED_LAYER_ID)) {
      map.setFilter(SELECTED_LAYER_ID, ['==', ['get', 'id'], selectedZoneId || '']);
    }
  }, [featureCollection, selectedZoneId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.easeTo({
      center: selectedCenter,
      zoom: selectedZoneId ? 13.2 : 12.4,
      duration: 650,
    });
  }, [selectedCenter, selectedZoneId]);

  if (!accessToken || mapError) {
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
    <View
      onLayout={() => mapRef.current?.resize()}
      style={[styles.map, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }, style]}
    >
      <View ref={containerRef} style={styles.mapHost} />

      {mapLoading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.surfaceMuted }]}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading live map...</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <MapControl icon="eye-outline" label="Recenter Naga City" onPress={() => mapRef.current?.easeTo({ center: [NAGA_CENTER.longitude, NAGA_CENTER.latitude], zoom: 12.4, duration: 450 })} />
        <MapControl icon="add" label="Zoom in" onPress={() => mapRef.current?.zoomIn()} />
        <MapControl icon="remove" label="Zoom out" onPress={() => mapRef.current?.zoomOut()} />
      </View>
    </View>
  );
}

function MapControl({ icon, label, onPress }) {
  const { theme } = useApp();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.control, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <Ionicons name={icon} size={18} color={theme.colors.text} />
    </Pressable>
  );
}

function addHeatmapLayers(map, featureCollection, selectedZoneId) {
  if (map.getSource(SOURCE_ID)) {
    return;
  }

  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: featureCollection,
  });

  map.addLayer({
    id: GLOW_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'size'], 72, 34, 120, 58],
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.28,
      'circle-blur': 0.68,
    },
  });

  map.addLayer({
    id: SELECTED_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', ['get', 'id'], selectedZoneId || ''],
    paint: {
      'circle-radius': 22,
      'circle-color': '#FFFFFF',
      'circle-opacity': 0.2,
      'circle-stroke-color': ['get', 'color'],
      'circle-stroke-width': 3,
    },
  });

  map.addLayer({
    id: CENTER_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-radius': 10,
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.94,
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': 3,
    },
  });
}

function attachZonePressHandlers(map, zones, onSelectZone) {
  map.on('click', CENTER_LAYER_ID, (event) => {
    const zoneId = event?.features?.[0]?.properties?.id;
    const selectedZone = zones.find((zone) => zone.id === zoneId);
    if (selectedZone) {
      onSelectZone?.(selectedZone);
    }
  });
  map.on('mouseenter', CENTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', CENTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = '';
  });
}

function getZoneColor(theme, colorKey) {
  return theme.crowd[colorKey] || theme.crowd.moderate;
}

function ensureMapboxBaseStyles() {
  if (typeof document === 'undefined' || document.getElementById(MAPBOX_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = MAPBOX_STYLE_ID;
  style.textContent = `
    .mapboxgl-map {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: Inter, Poppins, Arial, sans-serif;
    }
    .mapboxgl-canvas-container,
    .mapboxgl-canvas {
      width: 100%;
      height: 100%;
    }
    .mapboxgl-canvas {
      position: absolute;
      inset: 0;
      outline: none;
    }
    .mapboxgl-ctrl-bottom-left,
    .mapboxgl-ctrl-bottom-right {
      position: absolute;
      pointer-events: none;
      z-index: 2;
    }
    .mapboxgl-ctrl-bottom-left {
      left: 8px;
      bottom: 6px;
    }
    .mapboxgl-ctrl-bottom-right {
      right: 8px;
      bottom: 6px;
    }
    .mapboxgl-ctrl,
    .mapboxgl-ctrl a {
      pointer-events: auto;
      color: #1f2937;
      font-size: 10px;
    }
    .mapboxgl-ctrl-logo {
      display: block;
      width: 60px;
      height: 18px;
      opacity: 0.72;
    }
    .mapboxgl-ctrl-attrib {
      background: rgba(255, 255, 255, 0.78);
      border-radius: 8px;
      padding: 2px 6px;
    }
  `;
  document.head.appendChild(style);
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    aspectRatio: 0.82,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapHost: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.92,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
