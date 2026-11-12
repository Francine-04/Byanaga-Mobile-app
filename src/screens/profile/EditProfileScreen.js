import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { nationalityOptions } from '../../data/nationalities';
import AppHeader, { goToDashboard, goToMain } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import ProfilePortrait from '../../components/ProfilePortrait';
import Screen from '../../components/Screen';
import SelectionSheet from '../../components/SelectionSheet';
import SettingsRow from '../../components/SettingsRow';
import { saveProfileEdits } from '../../services/profilePhotoService';

export default function EditProfileScreen({ navigation }) {
  const { firebaseUser, travelerReady, backendErrors, isGuestMode, setIsGuestMode, setIsLoggedIn, theme, profile, setProfile, preferences } = useApp();
  const [draft, setDraft] = useState(profile);
  const [nationalityOpen, setNationalityOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoAssets, setPhotoAssets] = useState({});
  const editedFields = useRef(new Set());
  const saveInFlight = useRef(false);
  useEffect(() => {
    setDraft((current) => ({ ...profile, ...Object.fromEntries([...editedFields.current].map((field) => [field, current[field]])) }));
  }, [profile]);
  const update = (field) => (value) => {
    if (saveInFlight.current) return;
    editedFields.current.add(field);
    setDraft((current) => ({ ...current, [field]: value }));
    setError('');
  };
  const preferenceCount = preferences.places.length + preferences.activities.length;
  const handlePhotoSelected = (field, asset) => {
    if (saveInFlight.current) return;
    editedFields.current.add(field);
    setPhotoAssets((current) => ({ ...current, [field]: asset }));
    setDraft((current) => ({ ...current, [field]: asset.uri }));
    setError('');
  };
  const save = async () => {
    if (saveInFlight.current) return;
    if (isGuestMode || !firebaseUser || firebaseUser.isAnonymous) {
      setIsGuestMode(false);
      setIsLoggedIn(false);
      navigation.reset({ index: 0, routes: [{ name: 'Auth', params: { screen: 'Login' } }] });
      return;
    }
    if (!travelerReady) { setError(backendErrors.auth || 'Please wait for your saved profile to load.'); return; }
    if (!draft.name.trim()) { setError('Please enter your full name.'); return; }
    Keyboard.dismiss();
    saveInFlight.current = true;
    setError('');
    setSaving(true);
    try {
      const savedProfile = await saveProfileEdits(firebaseUser.uid, draft, photoAssets);
      setProfile(savedProfile);
      setPhotoAssets({});
      editedFields.current.clear();
      goToMain(navigation, 'Profile');
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save your profile.');
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Screen contentStyle={styles.content}>
        <AppHeader centered title="Edit Profile" onBack={() => { if (!saveInFlight.current) goToDashboard(navigation); }} backLabel="Back to dashboard" />
        <ProfilePortrait navigation={navigation} profile={draft} disabled={saving} onPhotoSelected={handlePhotoSelected} />
        <AppTextInput label="Full Name" value={draft.name} onChangeText={update('name')} autoComplete="name" maxLength={80} editable={!saving} />
        <AppTextInput label="Phone Number" value={draft.phone} onChangeText={update('phone')} keyboardType="phone-pad" autoComplete="tel" placeholder="Add phone number" maxLength={24} editable={!saving} />
        <AppTextInput label="Bio" value={draft.bio} onChangeText={update('bio')} multiline maxLength={200} editable={!saving} />
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Nationality</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Select nationality" disabled={saving} onPress={() => setNationalityOpen(true)}
          style={[styles.select, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
          <Text style={[styles.selectValue, { color: theme.colors.text }]}>{draft.nationality}</Text>
          <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
        </Pressable>
        <View style={[styles.preferenceLink, { borderColor: theme.colors.border }]}>
          <SettingsRow icon="options-outline" label="Travel Preferences" subtitle={preferenceCount + ' interests selected'}
            onPress={() => { if (!saveInFlight.current) navigation.navigate('TravelPreferences'); }} last />
        </View>
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        <AppButton title={saving ? 'Saving...' : 'Save Changes'} onPress={save} disabled={saving} style={styles.save} />
      </Screen>
      <SelectionSheet visible={nationalityOpen} title="Nationality" options={nationalityOptions}
        value={draft.nationality} onSelect={update('nationality')} onClose={() => setNationalityOpen(false)} searchable searchPlaceholder="Search nationality..." />
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { paddingTop: 8 },
  portrait: { alignItems: 'center', marginTop: 4, marginBottom: 22, paddingBottom: 20 },
  cover: { borderRadius: 8 }, avatar: { position: 'absolute', bottom: 0, width: 100, borderRadius: 50, borderWidth: 5 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  select: { minHeight: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectValue: { flex: 1, fontSize: 14, lineHeight: 21 },
  preferenceLink: { borderRadius: 8, borderWidth: 1, marginTop: 20 }, save: { marginTop: 28, borderRadius: 16 },
  error: { fontSize: 13, lineHeight: 20, marginTop: 16 },
});
