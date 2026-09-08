import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import mapboxgl from 'mapbox-gl';
import { useApp } from '../context/AppContext';
import { getMapboxAccessToken, getMapboxStyleUrl } from '../services/mapboxService';
import { NAGA_CENTER, isValidCoordinate } from '../utils/nagaBoundary';

const MAPBOX_STYLE_ID = 'byanaga-mapbox-web-base-styles';

export default function MapboxLocationPreview({ place, height = 220, style }) {
  const { theme } = useApp();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const accessToken = getMapboxAccessToken();
  const hasPlace = isValidCoordinate(place?.latitude, place?.longitude);
  const center = useMemo(
    () => [
      hasPlace ? Number(place.longitude) : NAGA_CENTER.longitude,
      hasPlace ? Number(place.latitude) : NAGA_CENTER.latitude,
    ],
    [hasPlace, place?.latitude, place?.longitude]
  );

  useEffect(() => {
    ensureMapboxBaseStyles();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !accessToken || mapRef.current || typeof window === 'undefined') {
      return undefined;
    }

    let resizeTimer = null;
    let loadTimer = null;

    try {
      setMapError(null);
      setMapLoading(true);
      mapboxgl.accessToken = accessToken;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: getMapboxStyleUrl(),
        center,
        zoom: hasPlace ? 15 : 12.4,
        attributionControl: true,
        logoPosition: 'bottom-left',
      });

      mapRef.current = map;
      loadTimer = window.setTimeout(() => { setMapLoading(false); setMapError('Map loading timed out. Check your connection and retry.'); }, 20000);
      map.once('load', () => {
        window.clearTimeout(loadTimer);
        setMapLoading(false);
        map.resize();
      });
      map.on('error', () => {
        if (!map.loaded()) {
          window.clearTimeout(loadTimer);
          setMapLoading(false);
          setMapError('Mapbox map could not load. Please check your connection and Mapbox token.');
        }
      });

      resizeTimer = window.setTimeout(() => map.resize(), 120);
    } catch (error) {
      setMapLoading(false);
      setMapError('Mapbox map could not load in this browser.');
    }

    return () => {
      window.clearTimeout(loadTimer);
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [accessToken, retryCount]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.easeTo({
      center,
      zoom: hasPlace ? 15.4 : 12.4,
      duration: 650,
    });

    markerRef.current?.remove();
    markerRef.current = null;

    if (hasPlace && typeof document !== 'undefined') {
      markerRef.current = new mapboxgl.Marker({
        element: createMarkerElement(theme.colors.primary),
        anchor: 'bottom',
      })
        .setLngLat(center)
        .addTo(map);
    }
  }, [center, hasPlace, theme.colors.primary, retryCount]);

  if (!accessToken) {
    return (
      <MapFallback
        height={height}
        style={style}
        message="Mapbox token is unavailable. Check EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN."
        place={place}
      />
    );
  }

  if (mapError) {
    return <View>
      <MapFallback height={height} style={style} message={mapError} place={place} />
      <Pressable accessibilityRole="button" accessibilityLabel="Retry location map" onPress={() => { setMapError(null); setRetryCount((value) => value + 1); }} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.primary }}>Retry Map</Text>
      </Pressable>
    </View>;
  }

  return (
    <View
      onLayout={() => mapRef.current?.resize()}
      style={[styles.card, { height, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }, style]}
    >
      <View ref={containerRef} style={styles.mapHost} />

      {mapLoading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.surfaceMuted }]}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading Mapbox map...</Text>
        </View>
      ) : null}

      <View style={styles.zoomControls}>
        <MapControlButton icon="add" label="Zoom in" onPress={() => mapRef.current?.zoomIn()} />
        <MapControlButton icon="remove" label="Zoom out" onPress={() => mapRef.current?.zoomOut()} />
      </View>

      <View style={[styles.caption, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.captionText, { color: theme.colors.text }]} numberOfLines={1}>
          {hasPlace ? place.name : 'Centered on Naga City'}
        </Text>
        <Text style={[styles.captionMeta, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {center[1].toFixed(5)}, {center[0].toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

function MapControlButton({ icon, label, onPress }) {
  const { theme } = useApp();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.zoomButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <Ionicons name={icon} size={20} color={theme.colors.text} />
    </Pressable>
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

function createMarkerElement(color) {
  const element = document.createElement('div');
  const dot = document.createElement('div');

  Object.assign(element.style, {
    width: '36px',
    height: '36px',
    borderRadius: '18px 18px 18px 4px',
    background: color,
    border: '3px solid #ffffff',
    boxShadow: '0 10px 24px rgba(8, 20, 36, 0.24)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-45deg)',
  });

  Object.assign(dot.style, {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    background: '#ffffff',
    transform: 'rotate(45deg)',
  });

  element.appendChild(dot);
  return element;
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
  card: {
    borderWidth: 1,
    borderRadius: 18,
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
  zoomControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  captionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  captionMeta: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '800',
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
