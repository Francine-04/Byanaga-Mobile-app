import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fallbackWeather } from '../services/weatherService';

export default function WeatherHeroCard({ theme, weather, weatherError, onRefresh, style }) {
  const [refreshing, setRefreshing] = useState(false);
  const [cardWidth, setCardWidth] = useState(0);
  const { width } = useWindowDimensions();
  const compact = cardWidth ? cardWidth < 700 : width < 700;
  const tight = cardWidth ? cardWidth < 310 : width < 350;
  const display = useMemo(() => normalizeWeather(weather), [weather]);

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <LinearGradient
      colors={[theme.brand.blue, '#18B9C8', theme.brand.green]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
      style={[styles.card, { shadowColor: theme.colors.shadow }, compact && styles.cardCompact, style]}
    >
      <View pointerEvents="none" style={[styles.mountainBand, styles.mountainBack]} />
      <View pointerEvents="none" style={[styles.mountainBand, styles.mountainMiddle]} />
      <View pointerEvents="none" style={[styles.mountainBand, styles.mountainFront]} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Refresh Naga City weather"
        onPress={handleRefresh}
        style={({ pressed }) => [styles.refreshButton, compact && styles.compactRefresh, pressed && styles.refreshPressed]}
      >
        {refreshing ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="navigate-outline" size={24} color="#FFFFFF" />}
      </Pressable>

      {compact ? <CompactLayout display={display} weatherError={weatherError} tight={tight} /> : <WideLayout display={display} weatherError={weatherError} />}
    </LinearGradient>
  );
}

function CompactLayout({ display, weatherError, tight }) {
  return (
    <View style={styles.compactContent}>
      <View style={[styles.compactTop, tight && styles.compactTopTight]}>
        <View style={[styles.compactConditionColumn, tight && styles.compactConditionColumnTight]}>
          <WeatherGlyph condition={display.condition} isDay={display.isDay} size={tight ? 74 : 82} />
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.conditionText, styles.compactConditionText, tight && styles.compactConditionTextTight]}>{display.condition}</Text>
        </View>

        <View style={styles.compactTemperatureColumn}>
          <TemperatureValue value={display.temperature} compact tight={tight} />
          <View style={styles.locationRow}>
            <Ionicons name="location" size={19} color="#FFFFFF" />
            <Text numberOfLines={1} style={[styles.cityText, styles.compactCityText, tight && styles.compactCityTextTight]}>{display.city}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricStrip}>
        <Metric icon="water-outline" label="Humidity" value={`${display.humidity}%`} />
        <View style={styles.metricDivider} />
        <Metric icon="swap-horizontal-outline" label="Wind" value={`${display.windSpeed} km/h`} detail={display.windDirection} />
        <View style={styles.metricDivider} />
        <Metric icon="rainy-outline" label="Rain Chance" value={`${display.rainChance}%`} />
      </View>
      <WeatherStatus weatherError={weatherError} source={display.source} />
    </View>
  );
}

function WideLayout({ display, weatherError }) {
  return (
    <View style={styles.wideContent}>
      <View style={styles.wideConditionColumn}>
        <WeatherGlyph condition={display.condition} isDay={display.isDay} size={106} />
        <Text numberOfLines={1} style={styles.conditionText}>{display.condition}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.wideTemperatureColumn}>
        <TemperatureValue value={display.temperature} />
        <View style={styles.locationRow}>
          <Ionicons name="location" size={22} color="#FFFFFF" />
          <Text numberOfLines={1} style={styles.cityText}>{display.city}</Text>
        </View>
        <WeatherStatus weatherError={weatherError} source={display.source} />
      </View>

      <View style={styles.divider} />

      <View style={styles.wideMetrics}>
        <Metric icon="water-outline" label="Humidity" value={`${display.humidity}%`} wide />
        <Metric icon="swap-horizontal-outline" label="Wind" value={`${display.windSpeed} km/h ${display.windDirection}`} wide />
        <Metric icon="rainy-outline" label="Rain Chance" value={`${display.rainChance}%`} wide />
      </View>
    </View>
  );
}

function TemperatureValue({ value, compact = false, tight = false }) {
  const available = value !== '--' && Number.isFinite(Number(value));
  const label = available ? `${Math.round(Number(value))} degrees Celsius` : 'Temperature unavailable';

  return (
    <View accessible accessibilityLabel={label} style={styles.temperatureRow}>
      <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={[styles.temperatureNumber, compact && styles.compactTemperatureNumber, tight && styles.tightTemperatureNumber]}>
        {available ? Math.round(Number(value)) : '--'}
      </Text>
      {available ? (
        <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={[styles.temperatureUnit, compact && styles.compactTemperatureUnit, tight && styles.tightTemperatureUnit]}>
          {'\u00B0C'}
        </Text>
      ) : null}
    </View>
  );
}

function Metric({ icon, label, value, detail, wide = false }) {
  return (
    <View style={[styles.metric, wide && styles.metricWide]}>
      <Ionicons name={icon} size={wide ? 30 : 24} color="#FFFFFF" />
      <View style={[styles.metricCopy, wide && styles.metricCopyWide]}>
        <Text numberOfLines={2} style={[styles.metricLabel, wide && styles.metricLabelWide]}>{label}</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.metricValue, wide && styles.metricValueWide]}>{value}</Text>
        {detail ? <Text numberOfLines={1} style={styles.metricDetail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function WeatherStatus({ weatherError, source }) {
  if (source === 'open-meteo' && !weatherError) return null;
  return (
    <Text numberOfLines={2} style={styles.statusText}>
      {source === 'open-meteo' ? 'Last reading; refresh unavailable' : 'Weather unavailable. Please try again.'}
    </Text>
  );
}

function WeatherGlyph({ condition, isDay, size }) {
  const scale = size / 100;
  const value = String(condition || '').toLowerCase();
  const night = isDay === false;
  const rainy = value.includes('rain') || value.includes('shower') || value.includes('storm') || value.includes('drizzle');
  const cloudy = rainy || value.includes('cloud') || value.includes('fog');
  const sunny = !night && (!cloudy || value.includes('partly') || value.includes('clear') || value.includes('sun'));

  return (
    <View style={{ width: size, height: size }}>
      {night ? (
        <View style={[styles.moon, { width: 48 * scale, height: 48 * scale, borderRadius: 24 * scale, top: 8 * scale, right: 10 * scale }]}>
          <View style={[styles.moonCutout, { width: 42 * scale, height: 42 * scale, borderRadius: 21 * scale, top: -5 * scale, right: -7 * scale }]} />
        </View>
      ) : null}

      {sunny ? (
        <>
          <View style={[styles.sun, { width: 46 * scale, height: 46 * scale, borderRadius: 23 * scale, top: 7 * scale, right: 7 * scale }]} />
          <View style={[styles.sunRay, { top: 0, right: 29 * scale, height: 13 * scale }]} />
          <View style={[styles.sunRay, { top: 25 * scale, right: 0, height: 13 * scale, transform: [{ rotate: '90deg' }] }]} />
          <View style={[styles.sunRay, { top: 8 * scale, right: 9 * scale, height: 13 * scale, transform: [{ rotate: '45deg' }] }]} />
        </>
      ) : null}

      {cloudy ? (
        <>
          <View style={[styles.cloudBubble, { width: 54 * scale, height: 54 * scale, borderRadius: 27 * scale, left: 4 * scale, top: 35 * scale }]} />
          <View style={[styles.cloudBubble, { width: 48 * scale, height: 48 * scale, borderRadius: 24 * scale, left: 36 * scale, top: 29 * scale }]} />
          <View style={[styles.cloudBase, { width: 88 * scale, height: 38 * scale, borderRadius: 19 * scale, left: 2 * scale, bottom: 16 * scale }]} />
        </>
      ) : null}

      {rainy ? (
        <View style={styles.rainDrops}>
          <View style={styles.rainDrop} />
          <View style={[styles.rainDrop, styles.rainDropMiddle]} />
          <View style={styles.rainDrop} />
        </View>
      ) : null}
    </View>
  );
}

function normalizeWeather(weather) {
  const next = { ...fallbackWeather, ...(weather || {}) };
  const temperature = toNumber(next.temperature, fallbackWeather.temperature);
  const humidity = toNumber(next.humidity, fallbackWeather.humidity);
  const windSpeed = toNumber(next.windSpeed, fallbackWeather.windSpeed);
  const rainChance = toNumber(next.rainChance, fallbackWeather.rainChance);
  const rawLabel = String(next.temperatureLabel || '').trim();
  const temperatureLabel = rawLabel === '--' ? '--' : rawLabel
    ? (/c$/i.test(rawLabel) ? rawLabel.replace(/\s*\u00B0?\s*c$/i, '\u00B0C') : `${rawLabel}\u00B0C`)
    : `${temperature}\u00B0C`;

  return {
    ...next,
    city: next.city || 'Naga City',
    condition: next.condition || fallbackWeather.condition,
    temperature,
    temperatureLabel,
    humidity,
    windSpeed,
    rainChance,
    windDirection: next.windDirection || fallbackWeather.windDirection,
  };
}

function toNumber(value, fallback) {
  if (value == null || value === '') return '--';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : fallback;
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    minHeight: 198,
    borderRadius: 34,
    padding: 18,
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cardCompact: {
    minHeight: 242,
    padding: 16,
    borderRadius: 30,
  },
  mountainBand: {
    position: 'absolute',
    left: -34,
    right: -34,
    height: 120,
    borderTopLeftRadius: 240,
    borderTopRightRadius: 240,
  },
  mountainBack: {
    bottom: -54,
    backgroundColor: 'rgba(9,92,116,0.24)',
    transform: [{ rotate: '-7deg' }],
  },
  mountainMiddle: {
    bottom: -70,
    backgroundColor: 'rgba(15,116,104,0.35)',
    transform: [{ rotate: '5deg' }],
  },
  mountainFront: {
    bottom: -86,
    backgroundColor: 'rgba(0,118,73,0.42)',
    transform: [{ rotate: '-2deg' }],
  },
  refreshButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    zIndex: 4,
  },
  refreshPressed: {
    opacity: 0.75,
  },
  compactRefresh: {
    top: 10,
    width: 44,
    height: 44,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingTop: 2,
  },
  compactConditionColumn: {
    width: 92,
    minWidth: 0,
    alignItems: 'center',
  },
  compactTopTight: {
    gap: 8,
    paddingRight: 46,
  },
  compactConditionColumnTight: {
    width: 82,
  },
  compactTemperatureColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  wideContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingRight: 62,
  },
  wideConditionColumn: {
    flex: 0.95,
    minWidth: 0,
  },
  wideTemperatureColumn: {
    flex: 1.2,
    minWidth: 0,
    alignItems: 'center',
  },
  wideMetrics: {
    flex: 1.15,
    gap: 16,
  },
  divider: {
    width: 1,
    height: '66%',
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  conditionText: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  compactConditionText: {
    width: '100%',
    marginTop: 2,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  compactConditionTextTight: {
    fontSize: 14,
    lineHeight: 19,
  },
  temperatureRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  temperatureNumber: {
    color: '#FFFFFF',
    fontSize: 64,
    lineHeight: 68,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  temperatureUnit: {
    marginTop: 7,
    marginLeft: 3,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  compactTemperatureNumber: {
    fontSize: 58,
    lineHeight: 64,
  },
  compactTemperatureUnit: {
    marginTop: 6,
    marginLeft: 2,
    fontSize: 27,
    lineHeight: 32,
  },
  tightTemperatureNumber: {
    fontSize: 52,
    lineHeight: 58,
  },
  tightTemperatureUnit: {
    marginTop: 5,
    fontSize: 23,
    lineHeight: 28,
  },
  compactCityText: { fontSize: 16, lineHeight: 22 },
  compactCityTextTight: { fontSize: 15, lineHeight: 21 },
  locationRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  metricStrip: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    minHeight: 68,
    paddingHorizontal: 2,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDivider: {
    width: 1,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  metricWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  metricCopy: {
    minWidth: 0,
    flexShrink: 1,
    alignItems: 'center',
  },
  metricCopyWide: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricLabelWide: {
    fontSize: 16,
    lineHeight: 21,
  },
  metricValue: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  metricDetail: {
    marginTop: 1,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  metricValueWide: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'left',
  },
  statusText: {
    marginTop: 8,
    marginRight: 48,
    alignSelf: 'flex-start',
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    fontWeight: '800',
  },
  sun: {
    position: 'absolute',
    backgroundColor: '#F4B400',
  },
  sunRay: {
    position: 'absolute',
    width: 7,
    borderRadius: 5,
    backgroundColor: '#F8D219',
  },
  cloudBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  cloudBase: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  moon: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  moonCutout: {
    position: 'absolute',
    backgroundColor: '#1BB7C6',
  },
  rainDrops: {
    position: 'absolute',
    left: 24,
    right: 18,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rainDrop: {
    width: 4,
    height: 15,
    borderRadius: 4,
    backgroundColor: '#DDF5FF',
    transform: [{ rotate: '18deg' }],
  },
  rainDropMiddle: {
    marginTop: 5,
  },
});
