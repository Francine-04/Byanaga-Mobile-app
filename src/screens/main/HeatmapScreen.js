import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { zonesToMarkers } from '../../utils/heatmapData';
import AppButton from '../../components/AppButton';
import BottomSheet from '../../components/BottomSheet';
import LiveHeatmapMap from '../../components/LiveHeatmapMap';
import Screen from '../../components/Screen';

export default function HeatmapScreen({ navigation }) {
  const { theme, heatZones, backendStatus, backendErrors } = useApp();
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const selected = useMemo(() => (
    heatZones.find((zone) => zone.id === selectedZoneId) || heatZones[0]
  ), [heatZones, selectedZoneId]);
  const markers = useMemo(() => zonesToMarkers(heatZones), [heatZones]);

  return (
    <Screen contentStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Naga City Heatmap</Text>
      <View style={styles.legend}>
        <Legend color={theme.crowd.low} label="Low" />
        <Legend color={theme.crowd.moderate} label="Moderate" />
        <Legend color={theme.crowd.busy} label="Busy" />
        <Legend color={theme.crowd.crowded} label="Crowded" />
      </View>
      <LiveHeatmapMap
        zones={heatZones}
        markers={markers}
        selectedZoneId={selected?.id}
        onSelectZone={(zone) => setSelectedZoneId(zone.id)}
        style={styles.map}
      />
      {selected ? <BottomSheet style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{selected.label}</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.colors.textMuted }]}>
              {backendStatus.heatmap === 'dashboard' ? 'Dashboard visit pattern' : 'Sample crowd pattern'}
            </Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: getZoneColor(theme, selected.colorKey) }]}>
            <Text style={styles.levelText}>{selected.level}</Text>
          </View>
        </View>
        <InfoRow label="Peak Hours" value={selected.peakHours} />
        <InfoRow label="Best Time to Visit" value={selected.bestTime} />
        <InfoRow label="Nearby Attractions" value={`${selected.nearbyCount || 5} places nearby`} />
        <InfoRow label="Suggested Alternative" value={selected.alternative} />
        <AppButton title="Add to Itinerary" onPress={() => navigation.navigate('CreateItinerary', { destination: selected.destination })} style={styles.button} />
      </BottomSheet> : <Text style={{ color: theme.colors.textMuted, marginTop: 16, lineHeight: 22 }}>
        {backendErrors.visitors || backendErrors.destinations ? 'Visit data could not load. Check your connection and backend permissions.' : 'No recorded visit activity yet. Published visit data will appear here.'}
      </Text>}
    </Screen>
  );
}

function Legend({ color, label }) {
  const { theme } = useApp();
  return (
    <View style={[styles.legendItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: theme.colors.text }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  const { theme } = useApp();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function getZoneColor(theme, key) {
  return theme.crowd[key] || theme.crowd.moderate;
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 14,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  legend: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  legendItem: {
    minHeight: 28,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '900',
  },
  map: {
    marginTop: 12,
    aspectRatio: 0.86,
  },
  sheet: {
    marginTop: 12,
    padding: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
  },
  levelBadge: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
  },
  button: {
    marginTop: 16,
  },
});
