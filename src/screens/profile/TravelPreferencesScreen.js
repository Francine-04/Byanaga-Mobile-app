import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import CategoryChip from '../../components/CategoryChip';
import Screen from '../../components/Screen';
import { saveTravelerPreferences } from '../../services/authService';

const groups = [
  { field: 'places', title: 'Places you enjoy', multi: true, options: ['Nature', 'Mountains', 'Churches', 'Museums', 'Historical', 'Food', 'Shopping', 'Events', 'Photography', 'Parks', 'Family Friendly'] },
  { field: 'activities', title: 'Activities you enjoy', multi: true, options: ['Walking', 'Food Trips', 'Photography', 'Museum Tour', 'Sightseeing', 'Camping', 'Adventure', 'Relaxation'] },
  { field: 'travelStyle', title: 'Travel style', options: ['Solo', 'Couple', 'Friends', 'Family'] },
  { field: 'budget', title: 'Budget', options: ['Budget', 'Moderate', 'Luxury'] },
  { field: 'duration', title: 'Trip duration', options: ['Half Day', 'One Day', 'Weekend'] },
];

export default function TravelPreferencesScreen({ navigation }) {
  const { firebaseUser, theme, preferences, setPreferences } = useApp();
  const [draft, setDraft] = useState(preferences);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const choose = (group, option) => setDraft((current) => ({ ...current, [group.field]: group.multi
    ? current[group.field].includes(option) ? current[group.field].filter((item) => item !== option) : [...current[group.field], option]
    : option }));
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (firebaseUser?.uid && !firebaseUser.isAnonymous) await saveTravelerPreferences(firebaseUser.uid, draft);
      setPreferences(draft);
      navigation.goBack();
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save preferences.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Travel Preferences" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      {groups.map((group) => (
        <View key={group.field} style={styles.group}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{group.title}</Text>
          <View style={styles.options}>
            {group.options.map((option) => <CategoryChip key={option} label={option}
              selected={group.multi ? draft[group.field].includes(option) : draft[group.field] === option} onPress={() => choose(group, option)} />)}
          </View>
        </View>
      ))}
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      <AppButton title={saving ? 'Saving...' : 'Save Preferences'} onPress={save} disabled={saving} style={styles.save} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: 8 }, group: { marginBottom: 18 }, label: { fontSize: 14, lineHeight: 21, fontWeight: '700', marginBottom: 10 },
  options: { flexDirection: 'row', flexWrap: 'wrap' }, save: { marginTop: 6, borderRadius: 16 },
  error: { marginBottom: 12, fontSize: 12, lineHeight: 18, fontWeight: '800' },
});
