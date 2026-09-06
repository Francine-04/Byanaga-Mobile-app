import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import PlaceholderImage from '../../components/PlaceholderImage';
import Screen from '../../components/Screen';
import SettingsRow from '../../components/SettingsRow';

export default function ProfileScreen({ navigation }) {
  const { theme, profile, preferences, bookmarks, savedTrips } = useApp();
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.coverWrap}>
        <PlaceholderImage label="Profile cover placeholder" showIcon={false} aspectRatio={2.9} style={[styles.cover, { backgroundColor: theme.colors.primarySoft }]} />
        <PlaceholderImage label="Profile photo placeholder" image={profile.image} icon="person" iconSize={58} aspectRatio={1}
          style={[styles.avatar, { borderColor: theme.colors.background }]} />
      </View>
      <Text style={[styles.name, { color: theme.colors.text }]}>{profile.name}</Text>
      <View style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}>
        <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Explorer</Text>
      </View>
      {profile.bio ? <Text style={[styles.bio, { color: theme.colors.textMuted }]}>{profile.bio}</Text> : null}
      <View style={[styles.stats, { borderColor: theme.colors.border }]}>
        <Stat label="Trips" value={savedTrips.length} />
        <Stat label="Saved Places" value={bookmarks.length} />
        <Stat label="Interests" value={preferences.places.length + preferences.activities.length} />
      </View>
      <View style={styles.menu}>
        <SettingsRow icon="person-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <SettingsRow icon="options-outline" label="Travel Preferences" onPress={() => navigation.navigate('TravelPreferences')} />
        <SettingsRow icon="bookmark-outline" label="Saved Places" onPress={() => navigation.navigate('SavedPlaces')} />
        <SettingsRow icon="calendar-outline" label="Saved Trips" onPress={() => navigation.navigate('Trips')} />
        <SettingsRow icon="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} />
        <SettingsRow icon="call-outline" label="Emergency Contacts" onPress={() => navigation.navigate('EmergencyContacts')} last />
      </View>
    </Screen>
  );
}
function Stat({ label, value }) {
  const { theme } = useApp();
  return <View style={styles.stat}><Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text><Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text></View>;
}
const styles = StyleSheet.create({
  content: { paddingTop: 8 }, coverWrap: { marginBottom: 42, alignItems: 'center' }, cover: { borderRadius: 8 },
  avatar: { position: 'absolute', bottom: -34, width: 100, borderRadius: 50, borderWidth: 5 },
  name: { fontSize: 21, lineHeight: 28, fontWeight: '700', textAlign: 'center' },
  badge: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' }, bio: { fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 12, paddingHorizontal: 16 },
  stats: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 24, paddingVertical: 18 },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 }, value: { fontSize: 20, fontWeight: '700' },
  label: { marginTop: 5, fontSize: 11, lineHeight: 16, textAlign: 'center' }, menu: { marginTop: 18 },
});
