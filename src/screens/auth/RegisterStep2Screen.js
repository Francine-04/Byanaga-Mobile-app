import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import CategoryChip from '../../components/CategoryChip';
import Screen from '../../components/Screen';
import StepProgress from '../../components/StepProgress';
import { registerTraveler, travelerRecordToAppState, saveTravelerPreferences } from '../../services/authService';
import { buildRegistrationProfile, getFirebaseAuthMessage, validatePreferenceForm } from '../../utils/authValidation';

const placeOptions = ['Nature', 'Mountains', 'Churches', 'Museums', 'Historical', 'Food', 'Shopping', 'Events', 'Photography', 'Parks', 'Family Friendly'];
const activityOptions = ['Walking', 'Food Trips', 'Photography', 'Museum Tour', 'Sightseeing', 'Camping', 'Adventure', 'Relaxation'];
const styleOptions = ['Solo', 'Couple', 'Friends', 'Family'];
const budgetOptions = ['Budget', 'Moderate', 'Luxury'];
const durationOptions = ['Half Day', 'One Day', 'Weekend'];

export default function RegisterStep2Screen({ navigation, route }) {
  const { theme, firebaseUser, setPreferences, setProfile, setIsGuestMode, setIsLoggedIn } = useApp();
  const socialOnboarding = route.params?.socialOnboarding === true;
  const registration = route.params?.registration;
  const [draft, setDraft] = useState(() => ({
    // Registration and first-time social onboarding must start unselected.
    places: [],
    activities: [],
    travelStyle: '',
    budget: '',
    duration: '',
  }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const missingRegistration = useMemo(() => !registration?.email || !registration?.password, [registration]);

  const toggleMulti = (field, label) => {
    setDraft((current) => {
      const list = current[field] || [];
      return {
        ...current,
        [field]: list.includes(label) ? list.filter((item) => item !== label) : [...list, label],
      };
    });
    setError('');
  };

  const chooseSingle = (field, label) => {
    setDraft((current) => ({ ...current, [field]: label }));
    setError('');
  };

  const savePreferences = async () => {
    if (missingRegistration && !socialOnboarding) {
      setError('Please complete Step 1 before saving your preferences.');
      return;
    }

    const preferenceErrors = validatePreferenceForm(draft);
    if (preferenceErrors.length) {
      setError(preferenceErrors.join(' '));
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (socialOnboarding) {
        if (!firebaseUser || firebaseUser.isAnonymous) throw new Error('Please sign in again to save preferences.');
        await saveTravelerPreferences(firebaseUser.uid, draft);
        setPreferences(draft);
        navigation.getParent()?.navigate('LocationPermission');
        return;
      }
      const profile = buildRegistrationProfile(registration);
      const result = await registerTraveler({
        email: profile.email,
        password: registration.password,
        profile,
        preferences: draft,
      });
      const appState = travelerRecordToAppState(result.record, result.user);

      setProfile((current) => ({ ...current, ...appState.profile }));
      setPreferences(appState.preferences);
      setIsGuestMode(false);
      setIsLoggedIn(true);
      navigation.getParent()?.navigate('LocationPermission');
    } catch (authError) {
      setError(getFirebaseAuthMessage(authError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => navigation.goBack()} rightIcon="information-circle-outline" rightLabel="Preference help" />
      <Text style={[styles.title, { color: theme.colors.text }]}>Travel Preferences</Text>
      <Text style={[styles.step, { color: theme.colors.text }]}>{socialOnboarding ? 'Personalize your trip' : 'Step 2 of 2'}</Text>
      <StepProgress progress={0.82} style={styles.progress} />
      <PreferenceGroup
        title="What places do you enjoy?"
        options={placeOptions}
        selected={draft.places}
        onPress={(label) => toggleMulti('places', label)}
      />
      <PreferenceGroup
        title="What activities do you enjoy?"
        options={activityOptions}
        selected={draft.activities}
        onPress={(label) => toggleMulti('activities', label)}
      />
      <PreferenceGroup
        title="Travel Style"
        options={styleOptions}
        selected={[draft.travelStyle]}
        onPress={(label) => chooseSingle('travelStyle', label)}
      />
      <PreferenceGroup
        title="Budget"
        options={budgetOptions}
        selected={[draft.budget]}
        onPress={(label) => chooseSingle('budget', label)}
      />
      <PreferenceGroup
        title="Trip Duration"
        options={durationOptions}
        selected={[draft.duration]}
        onPress={(label) => chooseSingle('duration', label)}
      />
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      <AppButton title={saving ? 'Creating account...' : 'Save Preferences'} onPress={savePreferences} disabled={saving} style={styles.button} />
    </Screen>
  );
}

function PreferenceGroup({ title, options, selected, onPress }) {
  const { theme } = useApp();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <CategoryChip key={option} label={option} selected={selected.includes(option)} onPress={() => onPress(option)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 30,
  },
  step: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
  },
  progress: {
    marginTop: 14,
    marginBottom: 12,
  },
  group: {
    marginTop: 20,
  },
  groupTitle: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  error: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  button: {
    marginTop: 24,
  },
});
