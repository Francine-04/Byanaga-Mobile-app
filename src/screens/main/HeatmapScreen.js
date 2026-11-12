import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { activityLevel, activityZones, dateDayKey, TOURISM_CATEGORIES } from '../../utils/automaticVisits';
import { visitDayKey } from '../../utils/checkinActivity';
import { watchAutomaticCounts, watchActivityConfig } from '../../services/automaticVisitService';
import { zonesToMarkers } from '../../utils/heatmapData';
import SelectField from '../../components/SelectField';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import BottomSheet from '../../components/BottomSheet';
import LiveHeatmapMap from '../../components/LiveHeatmapMap';
import Screen from '../../components/Screen';

const statusText = {
  off: 'Automatic visits are off. You can enable them using your existing location settings.',
  paused: 'Recording is paused while the app is in the background.',
  offline: 'Recording is paused while offline. Saved totals may be out of date.',
  waiting: 'Preparing automatic visit recording…',
  'no-places': 'Registered destination coordinates are not available yet.',
  'permission-required': 'Location access is unavailable. Review your existing location settings.',
  tracking: 'Automatic visits are on. Accurate GPS readings confirm arrivals and returns while you use the app.',
  accuracy: 'GPS accuracy is low. Waiting for clearer readings before saving a visit.',
  'gps-unavailable': 'GPS is temporarily unavailable. No visit will be saved until fresh readings arrive.',
};
const dayDate = (day) => new Date(Number(day) * 86400000).toISOString().slice(0, 10);

export default function HeatmapScreen({ navigation }) {
  const { theme, automaticVisits, firebaseUser } = useApp();
  const [period, setPeriod] = useState('Last 7 days');
  const [today, setToday] = useState(() => visitDayKey());
  const [fromDate, setFromDate] = useState(() => dayDate(Number(visitDayKey()) - 6));
  const [toDate, setToDate] = useState(() => dayDate(visitDayKey()));
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState('');
  const [countsError, setCountsError] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => { const timer = setInterval(() => setToday(visitDayKey()), 30000); return () => clearInterval(timer); }, []);
  const from = period === 'Custom dates' ? dateDayKey(fromDate) : String(Number(today) - (period === 'Today' ? 0 : period === 'Last 30 days' ? 29 : 6));
  const to = period === 'Custom dates' ? dateDayKey(toDate) : today;
  const validRange = from && to && Number(from) >= 10957 && Number(from) <= Number(to) && Number(to) <= Number(today) && Number(to) - Number(from) <= 365;
  const rangeKey = `${from}:${to}`;
  useEffect(() => watchActivityConfig((value) => { setConfig(value); setConfigError(''); }, () => { setConfig(null); setConfigError('Activity settings could not load.'); }), []);
  useEffect(() => {
    setCountsError('');
    if (!validRange) return undefined;
    return watchAutomaticCounts(from, to, (days) => { setSnapshot({ key: rangeKey, days }); setCountsError(''); }, () => { setSnapshot(null); setCountsError('Visit totals could not load. Check your connection.'); });
  }, [from, to, validRange, rangeKey]);
  const loaded = snapshot?.key === rangeKey && validRange;
  const zones = useMemo(() => loaded ? activityZones(automaticVisits.places, snapshot.days, config, category, level) : [], [loaded, automaticVisits.places, snapshot, config, category, level]);
  const selected = zones.find((zone) => zone.id === selectedId);
  const thresholdsValid = activityLevel(0, config) !== null;
  const markers = useMemo(() => zonesToMarkers(zones), [zones]);
  const openPermission = () => firebaseUser && !firebaseUser.isAnonymous
    ? navigation.navigate('LocationPermission', { returnToPrevious: true })
    : navigation.navigate('Auth', { screen: 'Login' });

  return <Screen contentStyle={styles.content}>
    <Text style={[styles.title, { color: theme.colors.text }]}>Tourism Heatmap</Text>
    <View style={[styles.tip, { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary }]}>
      <Text style={[styles.heading, { color: theme.colors.text }]}>About this map</Text>
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>See recorded visits to each place during your selected dates. Colors show how many visits were recorded, not how many people are there now. Each visitor’s travel history stays private.</Text>
    </View>
    <SelectField label="Date period (Philippine time)" value={period} options={['Today', 'Last 7 days', 'Last 30 days', 'Custom dates']} onSelect={setPeriod} />
    {period === 'Custom dates' && <View style={styles.row}>
      <AppTextInput label="From (YYYY-MM-DD)" value={fromDate} onChangeText={setFromDate} style={styles.column} />
      <AppTextInput label="To (YYYY-MM-DD)" value={toDate} onChangeText={setToDate} style={styles.column} />
    </View>}
    {!validRange && <Text style={{ color: theme.colors.danger }}>Choose valid dates from 2000 onward, ending no later than today (up to 366 days).</Text>}
    <View style={styles.row}>
      <SelectField label="Tourism category" value={category} options={['All', ...TOURISM_CATEGORIES]} onSelect={setCategory} style={styles.column} />
      <SelectField label="Activity level" value={level} options={['All', 'Low', 'Moderate', 'Busy', 'Crowded']} onSelect={setLevel} style={styles.column} />
    </View>
    <View style={styles.legend}>
      {['Low', 'Moderate', 'Busy', 'Crowded'].map((label) => <View key={label} style={[styles.legendItem, { borderColor: theme.colors.border }]}>
        <View style={[styles.dot, { backgroundColor: theme.crowd[label.toLowerCase()] }]} /><Text style={[styles.legendLabel, { color: theme.colors.text }]}>{label}</Text>
      </View>)}
    </View>
    {configError || countsError ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{configError || countsError}</Text> : null}
    {!thresholdsValid && !configError && <Text style={{ color: theme.colors.textMuted }}>Waiting for configured activity thresholds.</Text>}
    {!loaded && validRange && !countsError && <Text style={{ color: theme.colors.textMuted }}>Loading recorded visits…</Text>}
    {loaded && thresholdsValid && <>
      <LiveHeatmapMap zones={zones} markers={markers} selectedZoneId={selected?.id} onSelectZone={(zone) => setSelectedId(zone.id)} style={styles.map} />
      {!zones.length && <Text style={{ color: theme.colors.textMuted }}>No registered destinations match these filters.</Text>}
    </>}
    {selected && <BottomSheet style={styles.tip}>
      <Text style={[styles.heading, { color: theme.colors.text }]}>{selected.label}</Text>
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>{selected.destination.category} · {selected.count} recorded visits · {selected.level}</Text>
      <AppButton title="Add to Itinerary" onPress={() => navigation.navigate('CreateItinerary', { place: selected.destination })} style={{ marginTop: 10 }} />
    </BottomSheet>}
    <View style={[styles.tip, { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary }]}>
      <Text style={[styles.heading, { color: theme.colors.text }]}>Your automatic visits</Text>
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>{statusText[automaticVisits.status] || statusText.waiting}</Text>
      {automaticVisits.error && <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{automaticVisits.error}</Text>}
      {(!automaticVisits.consent || automaticVisits.status === 'permission-required') && <AppButton title="Review location settings" variant="secondary" onPress={openPermission} style={{ marginTop: 10 }} />}
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  content: { paddingTop: 14 }, title: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  tip: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 16, padding: 12, marginVertical: 10 },
  heading: { fontSize: 14, fontWeight: '800' }, copy: { fontSize: 12, lineHeight: 19, marginVertical: 5 },
  row: { flexDirection: 'row', gap: 10 }, column: { flex: 1, minWidth: 0 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 22, minHeight: 40, paddingHorizontal: 10, paddingVertical: 9 },
  legendLabel: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 }, map: { marginTop: 10, aspectRatio: 0.9 },
});
